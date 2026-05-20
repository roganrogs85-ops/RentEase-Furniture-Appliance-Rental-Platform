let products = [
  {
    id: "queen-bed-storage",
    name: "Queen Bed with Storage",
    category: "furniture",
    type: "Bed",
    rent: 849,
    deposit: 1999,
    tenures: [3, 6, 12],
    city: "Bengaluru",
    stock: 18,
    rented: 14,
    status: "available",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    description: "A sturdy queen bed with hydraulic storage, installation included, and mattress compatibility for urban apartments."
  },
  {
    id: "compact-sofa",
    name: "Compact 3-Seater Sofa",
    category: "furniture",
    type: "Sofa",
    rent: 699,
    deposit: 1499,
    tenures: [3, 6, 12],
    city: "Delhi NCR",
    stock: 13,
    rented: 11,
    status: "limited",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    description: "Apartment-friendly fabric sofa with stain-resistant upholstery, deep seating, and pickup-ready packaging."
  },
  {
    id: "work-table",
    name: "Work Desk and Chair Set",
    category: "furniture",
    type: "Table",
    rent: 499,
    deposit: 999,
    tenures: [1, 3, 6, 12],
    city: "Pune",
    stock: 26,
    rented: 18,
    status: "available",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
    description: "Ergonomic home-office kit with a laminated desk, adjustable chair, cable tray, and quick assembly."
  },
  {
    id: "single-door-fridge",
    name: "190L Single Door Refrigerator",
    category: "appliance",
    type: "Fridge",
    rent: 899,
    deposit: 2199,
    tenures: [3, 6, 12],
    city: "Mumbai",
    stock: 21,
    rented: 17,
    status: "available",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80",
    description: "Energy-efficient refrigerator for couples and small families, delivered sanitized with support coverage."
  },
  {
    id: "front-load-washer",
    name: "6kg Front Load Washing Machine",
    category: "appliance",
    type: "Washing machine",
    rent: 1099,
    deposit: 2499,
    tenures: [6, 12],
    city: "Hyderabad",
    stock: 15,
    rented: 12,
    status: "limited",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80",
    description: "Low-noise washing machine with installation support, inlet pipe kit, and annual preventive check."
  },
  {
    id: "smart-tv-43",
    name: "43-inch Smart LED TV",
    category: "appliance",
    type: "TV",
    rent: 999,
    deposit: 2299,
    tenures: [3, 6, 12],
    city: "Bengaluru",
    stock: 17,
    rented: 10,
    status: "available",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80",
    description: "Full HD smart TV with popular app support, wall-mount option, and remote replacement coverage."
  },
  {
    id: "starter-home-bundle",
    name: "Starter Home Bundle",
    category: "bundle",
    type: "Bundle",
    rent: 2499,
    deposit: 5999,
    tenures: [6, 12],
    city: "Delhi NCR",
    stock: 9,
    rented: 8,
    status: "limited",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    description: "Bed, sofa, work desk, refrigerator, and washing machine bundled for fast relocation setup."
  },
  {
    id: "premium-living-bundle",
    name: "Premium Living Bundle",
    category: "bundle",
    type: "Bundle",
    rent: 3299,
    deposit: 7999,
    tenures: [6, 12],
    city: "Mumbai",
    stock: 7,
    rented: 4,
    status: "available",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80",
    description: "Curated living room and appliance bundle for premium apartments, with priority maintenance."
  }
];

const storageKeys = {
  cart: "renteaseCart",
  rentals: "renteaseRentals",
  profile: "renteaseProfile",
  tickets: "renteaseTickets"
};

const api = {
  available: location.protocol !== "file:",
  async request(path, options = {}) {
    if (!this.available) {
      throw new Error("API unavailable when opened as a file.");
    }

    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Request failed.");
    }

    return payload;
  },
  get(path) {
    return this.request(path);
  },
  post(path, body) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  },
  patch(path, body) {
    return this.request(path, { method: "PATCH", body: JSON.stringify(body) });
  }
};

const catalogGrid = document.querySelector("#catalogGrid");
const rentalList = document.querySelector("#rentalList");
const inventoryTable = document.querySelector("#inventoryTable");
const scheduleList = document.querySelector("#scheduleList");
const claimList = document.querySelector("#claimList");
const supportProduct = document.querySelector("#supportProduct");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll("[data-filter]");
const cartDrawer = document.querySelector("[data-cart]");
const cartItems = document.querySelector("#cartItems");
const productModal = document.querySelector("[data-product-modal]");
const authModal = document.querySelector("[data-auth-modal]");
const toast = document.querySelector("[data-toast]");

let activeFilter = "all";
let activeProduct = products[0];
let selectedTenure = products[0].tenures[0];
let cart = readStore(storageKeys.cart, []);
let rentals = readStore(storageKeys.rentals, []);
let tickets = readStore(storageKeys.tickets, [
  { id: "MNT-1042", product: "Compact 3-Seater Sofa", status: "Inspection", eta: "Today" },
  { id: "DMG-1188", product: "190L Single Door Refrigerator", status: "Claim review", eta: "24h" }
]);

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function loadBackendState() {
  try {
    const [productPayload, rentalPayload, ticketPayload] = await Promise.all([
      api.get("/api/products"),
      api.get("/api/rentals"),
      api.get("/api/maintenance")
    ]);

    products = productPayload.products || products;
    rentals = rentalPayload.rentals || rentals;
    tickets = ticketPayload.tickets || tickets;
    writeStore(storageKeys.rentals, rentals);
    writeStore(storageKeys.tickets, tickets);
  } catch (error) {
    api.available = false;
    showToast("Using browser storage until the backend is running.");
  }
}

function money(value) {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("active");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("active"), 2600);
}

function productMatches(product) {
  const query = searchInput.value.trim().toLowerCase();
  const filterMatch = activeFilter === "all" || product.category === activeFilter;
  const searchable = `${product.name} ${product.type} ${product.category} ${product.city}`.toLowerCase();
  return filterMatch && (!query || searchable.includes(query));
}

function renderCatalog() {
  const visibleProducts = products.filter(productMatches);
  catalogGrid.innerHTML = "";

  if (!visibleProducts.length) {
    catalogGrid.innerHTML = `<div class="empty-state">No rental products match the current search.</div>`;
  } else {
    visibleProducts.forEach((product) => {
      const article = document.createElement("article");
      article.className = "product-card";
      article.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <span class="category-pill">${product.category}</span>
        </div>
        <div class="product-body">
          <span class="status-pill ${product.status}">${product.status}</span>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="price-row">
            <span><small>Monthly rent</small><strong>${money(product.rent)}</strong></span>
            <span><small>Deposit</small><strong>${money(product.deposit)}</strong></span>
          </div>
          <div class="card-actions">
            <button class="button button-primary" type="button" data-add="${product.id}">
              <i data-lucide="shopping-cart"></i>
              Add
            </button>
            <button class="icon-button" type="button" data-details="${product.id}" aria-label="View ${product.name} details">
              <i data-lucide="info"></i>
            </button>
          </div>
        </div>
      `;
      catalogGrid.appendChild(article);
    });
  }

  catalogGrid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });

  catalogGrid.querySelectorAll("[data-details]").forEach((button) => {
    button.addEventListener("click", () => openProduct(button.dataset.details));
  });

  refreshIcons();
}

function addToCart(productId, tenure) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
    existing.tenure = tenure || existing.tenure;
  } else {
    cart.push({ productId, quantity: 1, tenure: tenure || product.tenures[0] });
  }

  writeStore(storageKeys.cart, cart);
  renderCart();
  showToast(`${product.name} added to cart.`);
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  writeStore(storageKeys.cart, cart);
  renderCart();
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector("[data-cart-count]").textContent = count;

  if (!cart.length) {
    cartItems.innerHTML = `<div class="empty-state">Your cart is ready for rentals.</div>`;
  } else {
    cartItems.innerHTML = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return `
        <article class="cart-item">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${money(product.rent)} / mo · ${item.tenure} months · Qty ${item.quantity}</p>
          </div>
          <button class="icon-button" type="button" data-remove="${item.productId}" aria-label="Remove ${product.name}">
            <i data-lucide="trash-2"></i>
          </button>
        </article>
      `;
    }).join("");
  }

  const totalRent = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + product.rent * item.quantity;
  }, 0);
  const totalDeposit = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + product.deposit * item.quantity;
  }, 0);

  document.querySelector("[data-total-rent]").textContent = money(totalRent);
  document.querySelector("[data-total-deposit]").textContent = money(totalDeposit);

  cartItems.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(button.dataset.remove));
  });

  refreshIcons();
}

function openCart() {
  cartDrawer.classList.add("active");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-open");
}

function closeCart() {
  cartDrawer.classList.remove("active");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");
}

function openProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  activeProduct = product;
  selectedTenure = product.tenures[0];

  productModal.querySelector("[data-modal-image]").src = product.image;
  productModal.querySelector("[data-modal-image]").alt = product.name;
  productModal.querySelector("[data-modal-category]").textContent = `${product.category} · ${product.city}`;
  productModal.querySelector("[data-modal-title]").textContent = product.name;
  productModal.querySelector("[data-modal-description]").textContent = product.description;
  productModal.querySelector("[data-modal-rent]").textContent = money(product.rent);
  productModal.querySelector("[data-modal-deposit]").textContent = money(product.deposit);
  productModal.querySelector("[data-modal-meta]").innerHTML = `
    <span>${product.type}</span>
    <span>${product.stock - product.rented} available</span>
    <span>${product.stock} total units</span>
    <span>Maintenance included</span>
  `;
  productModal.querySelector("[data-modal-tenures]").innerHTML = product.tenures.map((tenure, index) => `
    <button class="${index === 0 ? "active" : ""}" type="button" data-tenure="${tenure}">${tenure} months</button>
  `).join("");

  productModal.querySelectorAll("[data-tenure]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTenure = Number(button.dataset.tenure);
      productModal.querySelectorAll("[data-tenure]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  productModal.classList.add("active");
  productModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-open");
  refreshIcons();
}

function closeProduct() {
  productModal.classList.remove("active");
  productModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");
}

function renderRentals() {
  if (!rentals.length) {
    rentalList.innerHTML = `<div class="empty-state">Confirmed rentals will appear here after checkout.</div>`;
  } else {
    rentalList.innerHTML = rentals.map((rental) => {
      const product = products.find((item) => item.id === rental.productId);
      return `
        <article class="rental-card">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${rental.city} · ${rental.tenure} months · Delivery ${rental.deliveryDate}</p>
            <span class="status-pill available">${rental.status}</span>
          </div>
          <div class="rental-actions">
            <button class="ghost-button" type="button" data-extend="${rental.id}">
              <i data-lucide="refresh-cw"></i>
              Extend
            </button>
            <button class="ghost-button" type="button" data-return="${rental.id}">
              <i data-lucide="undo-2"></i>
              Pickup
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  rentalList.querySelectorAll("[data-extend]").forEach((button) => {
    button.addEventListener("click", () => updateRentalStatus(button.dataset.extend, "Extension requested"));
  });

  rentalList.querySelectorAll("[data-return]").forEach((button) => {
    button.addEventListener("click", () => updateRentalStatus(button.dataset.return, "Pickup scheduled"));
  });

  supportProduct.innerHTML = [
    ...rentals.map((rental) => products.find((product) => product.id === rental.productId).name),
    "General support"
  ].map((name) => `<option>${name}</option>`).join("");

  refreshIcons();
}

async function updateRentalStatus(id, status) {
  try {
    if (api.available) {
      const payload = await api.patch(`/api/rentals/${id}`, { status });
      rentals = rentals.map((rental) => rental.id === id ? payload.rental : rental);
    } else {
      rentals = rentals.map((rental) => rental.id === id ? { ...rental, status } : rental);
    }
  } catch (error) {
    showToast(error.message);
    return;
  }

  writeStore(storageKeys.rentals, rentals);
  renderRentals();
  renderAdmin();
  showToast(status);
}

function renderAdmin() {
  inventoryTable.innerHTML = products.slice(0, 5).map((product) => `
    <div class="mini-row">
      <span>${product.name}</span>
      <strong>${product.stock - product.rented}/${product.stock}</strong>
    </div>
  `).join("");

  const schedules = rentals.slice(-4).reverse();
  scheduleList.innerHTML = schedules.length
    ? schedules.map((rental) => {
      const product = products.find((item) => item.id === rental.productId);
      return `
        <div class="schedule-item">
          <span>${product.name}<br>${rental.city} · ${rental.deliveryDate}</span>
          <strong>${rental.status}</strong>
        </div>
      `;
    }).join("")
    : `<div class="empty-state">Delivery slots will populate after checkout.</div>`;

  claimList.innerHTML = tickets.map((ticket) => `
    <div class="claim-item">
      <span>${ticket.id}<br>${ticket.product}</span>
      <strong>${ticket.status}</strong>
    </div>
  `).join("");

  document.querySelector("[data-kpi-active]").textContent = 126 + rentals.length;
  const mrr = 480000 + rentals.reduce((sum, rental) => {
    const product = products.find((item) => item.id === rental.productId);
    return sum + product.rent;
  }, 0);
  document.querySelector("[data-kpi-mrr]").textContent = `Rs ${(mrr / 100000).toFixed(1)}L`;
}

async function submitCheckout(event) {
  event.preventDefault();
  if (!cart.length) {
    showToast("Add at least one product before checkout.");
    return;
  }

  const city = document.querySelector("#checkoutCity").value;
  const deliveryDate = document.querySelector("#deliveryDate").value;
  const address = document.querySelector("#deliveryAddress").value.trim();

  try {
    if (api.available) {
      const payload = await api.post("/api/orders", { items: cart, city, deliveryDate, address });
      rentals = [...rentals, ...(payload.rentals || [])];
      products = payload.products || products;
    } else {
      const created = cart.flatMap((item) => {
        return Array.from({ length: item.quantity }, () => ({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          productId: item.productId,
          tenure: item.tenure,
          city,
          deliveryDate,
          address,
          status: "Delivery scheduled"
        }));
      });
      rentals = [...rentals, ...created];
    }
  } catch (error) {
    showToast(error.message);
    return;
  }

  cart = [];
  writeStore(storageKeys.rentals, rentals);
  writeStore(storageKeys.cart, cart);
  renderCatalog();
  renderCart();
  renderRentals();
  renderAdmin();
  closeCart();
  event.target.reset();
  setMinDeliveryDate();
  showToast("Rental confirmed. Delivery has been scheduled.");
}

async function submitSupport(event) {
  event.preventDefault();
  const product = document.querySelector("#supportProduct").value;
  const issue = document.querySelector("#supportIssue").value;
  const notes = document.querySelector("#supportNotes").value.trim();

  let ticket;
  try {
    if (api.available) {
      const payload = await api.post("/api/maintenance", { product, issue, notes });
      ticket = payload.ticket;
    } else {
      ticket = {
        id: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
        product,
        status: issue,
        eta: "24h",
        notes
      };
    }
  } catch (error) {
    showToast(error.message);
    return;
  }

  tickets = [ticket, ...tickets].slice(0, 6);
  writeStore(storageKeys.tickets, tickets);
  renderAdmin();
  event.target.reset();
  showToast(`Support ticket ${ticket.id} created.`);
}

async function submitAuth(event) {
  event.preventDefault();
  const profile = {
    name: document.querySelector("#authName").value.trim(),
    email: document.querySelector("#authEmail").value.trim(),
    city: document.querySelector("#authCity").value
  };

  try {
    if (api.available) {
      const payload = await api.post("/api/auth/register", profile);
      profile.id = payload.user.id;
    }
  } catch (error) {
    showToast(error.message);
    return;
  }

  writeStore(storageKeys.profile, profile);
  authModal.classList.remove("active");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");
  showToast(`Welcome, ${profile.name}. Your renter profile is saved.`);
}

function setMinDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  document.querySelector("#deliveryDate").min = date.toISOString().slice(0, 10);
}

function exportReport() {
  const totalRentals = rentals.length;
  const openTickets = tickets.length;
  const cartValue = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + product.rent * item.quantity;
  }, 0);
  const report = [
    "Rentease Operations Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Active demo rentals: ${totalRentals}`,
    `Open service tickets: ${openTickets}`,
    `Current cart monthly value: ${money(cartValue)}`,
    `Service cities: Bengaluru, Delhi NCR, Mumbai, Pune, Hyderabad`
  ].join("\n");

  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rentease-report.txt";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Operations report exported.");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderCatalog();
  });
});

searchInput.addEventListener("input", renderCatalog);
document.querySelector("[data-open-cart]").addEventListener("click", openCart);
document.querySelector("[data-close-cart]").addEventListener("click", closeCart);
document.querySelector("[data-close-product]").addEventListener("click", closeProduct);
document.querySelector("[data-open-auth]").addEventListener("click", () => {
  authModal.classList.add("active");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-open");
});
document.querySelector("[data-close-auth]").addEventListener("click", () => {
  authModal.classList.remove("active");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");
});
document.querySelector("[data-menu-toggle]").addEventListener("click", () => {
  document.querySelector("[data-nav-menu]").classList.toggle("active");
});
document.querySelector("[data-modal-add]").addEventListener("click", () => {
  addToCart(activeProduct.id, selectedTenure);
  closeProduct();
  openCart();
});
document.querySelector("[data-modal-maintenance]").addEventListener("click", () => {
  closeProduct();
  document.querySelector("#supportProduct").value = activeProduct.name;
  document.querySelector("#rentals").scrollIntoView({ behavior: "smooth" });
});
document.querySelector("#checkoutForm").addEventListener("submit", submitCheckout);
document.querySelector("#supportForm").addEventListener("submit", submitSupport);
document.querySelector("#authForm").addEventListener("submit", submitAuth);
document.querySelector("[data-seed-rental]").addEventListener("click", () => {
  const demo = products[5];
  rentals = [...rentals, {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    productId: demo.id,
    tenure: 6,
    city: demo.city,
    deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    address: "Demo apartment, city center",
    status: "Active"
  }];
  writeStore(storageKeys.rentals, rentals);
  renderRentals();
  renderAdmin();
  showToast("Demo rental added.");
});
document.querySelector("[data-export-report]").addEventListener("click", exportReport);

[productModal, authModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("overlay-open");
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProduct();
    closeCart();
    authModal.classList.remove("active");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overlay-open");
  }
});

window.addEventListener("scroll", () => {
  document.querySelector("[data-topbar]").classList.toggle("scrolled", window.scrollY > 12);
});

async function boot() {
  setMinDeliveryDate();
  renderCatalog();
  renderCart();
  renderRentals();
  renderAdmin();
  refreshIcons();
  await loadBackendState();
  renderCatalog();
  renderCart();
  renderRentals();
  renderAdmin();
  refreshIcons();
}

boot();
