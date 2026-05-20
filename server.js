const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "db.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function readDb() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
  });
}

function requireFields(payload, fields) {
  return fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    city: user.city,
    createdAt: user.createdAt
  };
}

function buildAnalytics(db) {
  const activeRentalCount = db.rentals.filter((rental) => rental.status !== "Pickup scheduled").length;
  const rentalMrr = db.rentals.reduce((sum, rental) => {
    const product = db.products.find((item) => item.id === rental.productId);
    return sum + (product ? product.rent : 0);
  }, 0);
  const totalStock = db.products.reduce((sum, product) => sum + product.stock, 0);
  const rentedStock = db.products.reduce((sum, product) => sum + product.rented, 0) + activeRentalCount;

  return {
    activeRentals: 126 + activeRentalCount,
    monthlyRecurringRevenue: 480000 + rentalMrr,
    productUtilizationRate: totalStock ? Math.round((rentedStock / totalStock) * 100) : 0,
    retentionRate: 74,
    maintenanceResolutionHours: 18,
    openTickets: db.tickets.length,
    serviceAreas: ["Bengaluru", "Delhi NCR", "Mumbai", "Pune", "Hyderabad"]
  };
}

async function handleApi(req, res, url) {
  const db = readDb();
  const pathName = url.pathname;

  if (req.method === "GET" && pathName === "/api/health") {
    sendJson(res, 200, { ok: true, name: "Rentease API", timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && pathName === "/api/products") {
    const category = url.searchParams.get("category");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const products = db.products.filter((product) => {
      const categoryMatch = !category || category === "all" || product.category === category;
      const queryMatch = !q || `${product.name} ${product.type} ${product.category} ${product.city}`.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
    sendJson(res, 200, { products });
    return;
  }

  if (req.method === "GET" && pathName.startsWith("/api/products/")) {
    const id = decodeURIComponent(pathName.split("/").pop());
    const product = db.products.find((item) => item.id === id);
    product ? sendJson(res, 200, { product }) : sendError(res, 404, "Product not found.");
    return;
  }

  if (req.method === "POST" && pathName === "/api/auth/register") {
    const payload = await parseBody(req);
    const missing = requireFields(payload, ["name", "email", "city"]);
    if (missing.length) {
      sendError(res, 400, `Missing required fields: ${missing.join(", ")}.`);
      return;
    }

    const email = String(payload.email).trim().toLowerCase();
    const existing = db.users.find((user) => user.email === email);
    const user = existing || {
      id: crypto.randomUUID(),
      name: String(payload.name).trim(),
      email,
      city: String(payload.city).trim(),
      createdAt: new Date().toISOString()
    };

    if (!existing) {
      db.users.push(user);
      writeDb(db);
    }

    sendJson(res, existing ? 200 : 201, { user: publicUser(user) });
    return;
  }

  if (req.method === "GET" && pathName === "/api/rentals") {
    sendJson(res, 200, { rentals: db.rentals });
    return;
  }

  if (req.method === "POST" && pathName === "/api/orders") {
    const payload = await parseBody(req);
    const missing = requireFields(payload, ["city", "deliveryDate", "address"]);
    if (missing.length || !Array.isArray(payload.items) || payload.items.length === 0) {
      sendError(res, 400, "Order requires city, deliveryDate, address, and at least one item.");
      return;
    }

    const createdRentals = [];
    const orderItems = [];

    for (const item of payload.items) {
      const product = db.products.find((entry) => entry.id === item.productId);
      const quantity = Math.max(1, Number(item.quantity || 1));
      const tenure = Number(item.tenure || product?.tenures?.[0]);

      if (!product) {
        sendError(res, 404, `Product not found: ${item.productId}.`);
        return;
      }
      if (!product.tenures.includes(tenure)) {
        sendError(res, 400, `Invalid tenure for ${product.name}.`);
        return;
      }
      if (product.stock - product.rented < quantity) {
        sendError(res, 409, `${product.name} does not have enough available inventory.`);
        return;
      }

      for (let index = 0; index < quantity; index += 1) {
        const rental = {
          id: crypto.randomUUID(),
          productId: product.id,
          tenure,
          city: String(payload.city).trim(),
          deliveryDate: String(payload.deliveryDate).trim(),
          address: String(payload.address).trim(),
          status: "Delivery scheduled",
          createdAt: new Date().toISOString()
        };
        createdRentals.push(rental);
      }

      product.rented += quantity;
      product.status = product.stock - product.rented <= 2 ? "limited" : "available";
      orderItems.push({ productId: product.id, quantity, tenure, rent: product.rent, deposit: product.deposit });
    }

    const order = {
      id: crypto.randomUUID(),
      items: orderItems,
      city: String(payload.city).trim(),
      deliveryDate: String(payload.deliveryDate).trim(),
      address: String(payload.address).trim(),
      totalRent: orderItems.reduce((sum, item) => sum + item.rent * item.quantity, 0),
      totalDeposit: orderItems.reduce((sum, item) => sum + item.deposit * item.quantity, 0),
      createdAt: new Date().toISOString()
    };

    db.orders.push(order);
    db.rentals.push(...createdRentals);
    writeDb(db);
    sendJson(res, 201, { order, rentals: createdRentals, products: db.products });
    return;
  }

  if (req.method === "PATCH" && pathName.startsWith("/api/rentals/")) {
    const id = decodeURIComponent(pathName.split("/")[3] || "");
    const payload = await parseBody(req);
    const rental = db.rentals.find((item) => item.id === id);
    if (!rental) {
      sendError(res, 404, "Rental not found.");
      return;
    }

    rental.status = String(payload.status || rental.status).trim();
    rental.updatedAt = new Date().toISOString();
    writeDb(db);
    sendJson(res, 200, { rental });
    return;
  }

  if (req.method === "GET" && pathName === "/api/maintenance") {
    sendJson(res, 200, { tickets: db.tickets });
    return;
  }

  if (req.method === "POST" && pathName === "/api/maintenance") {
    const payload = await parseBody(req);
    const missing = requireFields(payload, ["product", "issue", "notes"]);
    if (missing.length) {
      sendError(res, 400, `Missing required fields: ${missing.join(", ")}.`);
      return;
    }

    const ticket = {
      id: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
      product: String(payload.product).trim(),
      status: String(payload.issue).trim(),
      eta: "24h",
      notes: String(payload.notes).trim(),
      createdAt: new Date().toISOString()
    };

    db.tickets.unshift(ticket);
    writeDb(db);
    sendJson(res, 201, { ticket });
    return;
  }

  if (req.method === "GET" && pathName === "/api/admin/analytics") {
    sendJson(res, 200, {
      analytics: buildAnalytics(db),
      inventory: db.products,
      schedules: db.rentals.slice(-8).reverse(),
      tickets: db.tickets
    });
    return;
  }

  sendError(res, 404, "API route not found.");
}

function serveStatic(req, res, url) {
  const safePath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, safePath));

  if (!filePath.startsWith(ROOT)) {
    sendError(res, 403, "Forbidden.");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(ROOT, "index.html"), (fallbackError, fallbackData) => {
        if (fallbackError) {
          sendError(res, 404, "File not found.");
          return;
        }
        res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
        res.end(fallbackData);
      });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=3600"
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    sendError(res, 500, error.message || "Server error.");
  }
});

server.listen(PORT, () => {
  console.log(`Rentease running at http://localhost:${PORT}`);
});
