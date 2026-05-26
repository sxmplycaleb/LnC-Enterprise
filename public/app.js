function getInitialTheme() {
  const savedTheme = localStorage.getItem("commerce-theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const state = {
  user: null,
  products: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem("commerce-cart") || "[]"),
  authMode: "login",
  editingProductId: null,
  theme: getInitialTheme()
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function applyTheme(theme) {
  state.theme = theme === "light" ? "light" : "dark";
  document.body.classList.toggle("light-theme", state.theme === "light");
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("commerce-theme", state.theme);
  const button = $("#themeToggleButton");
  if (button) {
    const nextTheme = state.theme === "light" ? "dark" : "light";
    button.querySelector(".theme-icon").textContent = state.theme === "light" ? "☾" : "☀";
    button.querySelector(".theme-label").textContent = state.theme === "light" ? "Dark" : "Light";
    button.setAttribute("title", `Switch to ${nextTheme} theme`);
    button.setAttribute("aria-label", `Switch to ${state.theme === "light" ? "dark" : "light"} theme`);
    button.setAttribute("aria-pressed", state.theme === "light" ? "true" : "false");
  }
}

function toggleTheme() {
  applyTheme(state.theme === "light" ? "dark" : "light");
}
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(node.timeout);
  node.timeout = setTimeout(() => node.classList.remove("show"), 2800);
}

function persistCart() {
  localStorage.setItem("commerce-cart", JSON.stringify(state.cart));
  renderCart();
}

function currentCartTotal() {
  return state.cart.reduce((sum, item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function switchView(viewName) {
  $$(".view").forEach((view) => view.classList.remove("active"));
  $(`#${viewName}View`).classList.add("active");
  $$(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  if (viewName === "orders") loadOrders();
  if (viewName === "admin") {
    renderAdminProducts();
    loadAdminOrders();
  }
}

function updateAuthUI() {
  $("#authButton").textContent = state.user ? `${state.user.name} | Sign out` : "Sign in";
  $$(".admin-only").forEach((node) => node.classList.toggle("hidden", state.user?.role !== "admin"));
}

async function loadMe() {
  const data = await api("/api/auth/me");
  state.user = data.user;
  updateAuthUI();
}

async function loadProducts() {
  const params = new URLSearchParams({
    search: $("#searchInput").value,
    category: $("#categorySelect").value,
    maxPrice: $("#priceRange").value,
    minRating: $("#ratingSelect").value,
    inStock: $("#stockCheckbox").checked
  });
  const data = await api(`/api/products?${params}`);
  state.products = data.products;
  state.categories = data.categories;
  renderCategoryOptions();
  renderProducts();
  renderCart();
}

function renderCategoryOptions() {
  const select = $("#categorySelect");
  const selected = select.value;
  select.innerHTML = `<option value="all">All categories</option>${state.categories.map((category) => (
    `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
  )).join("")}`;
  select.value = state.categories.includes(selected) ? selected : "all";
}

function renderProducts() {
  $("#resultCount").textContent = `${state.products.length} item${state.products.length === 1 ? "" : "s"}`;
  $("#metricProducts").textContent = state.products.length;
  const grid = $("#productGrid");
  if (!state.products.length) {
    grid.innerHTML = `<div class="wide-panel">No products match those filters.</div>`;
    return;
  }
  grid.innerHTML = state.products.map((product) => `
    <article class="product-card" onclick="openProductDetail('${product.id}')">
      <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.name)}">
      <div class="product-body">
        <div class="product-meta">
          <span class="pill">${escapeHtml(product.category)}</span>
          <strong>${product.rating.toFixed(1)} stars</strong>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-footer">
          <span class="price">${money(product.price)}</span>
          <span>${product.stock} left</span>
        </div>
        <button class="primary-button" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.stock < 1 ? "disabled" : ""}>Add to cart</button>
      </div>
    </article>
  `).join("");
}

function openProductDetail(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return;
  const reviews = renderProductReviews(product.reviews);
  const tags = (product.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("");
  $("#productDetailContent").innerHTML = `
    <div class="product-detail-layout">
      <img class="detail-image" src="${escapeAttr(product.image)}" alt="${escapeAttr(product.name)}">
      <div class="detail-info">
        <div class="product-meta">
          <span class="pill">${escapeHtml(product.category)}</span>
          <strong>${product.rating.toFixed(1)} stars</strong>
        </div>
        <h2 id="detailProductName">${escapeHtml(product.name)}</h2>
        <p>${escapeHtml(product.description)}</p>
        <div class="detail-stats">
          <div><span>Price</span><strong>${money(product.price)}</strong></div>
          <div><span>Stock</span><strong>${product.stock} left</strong></div>
          <div><span>Reviews</span><strong>${(product.reviews || []).length}</strong></div>
        </div>
        <div class="detail-tags">${tags}</div>
        <button class="primary-button" onclick="addToCart('${product.id}'); closeProductDetail();" ${product.stock < 1 ? "disabled" : ""}>Add to cart</button>
      </div>
    </div>
    <div class="detail-review-section">
      <div class="section-heading">
        <span>Customer Reviews</span>
        <strong>${(product.reviews || []).length} comments</strong>
      </div>
      ${reviews || '<p class="muted-copy">No reviews yet.</p>'}
    </div>
  `;
  $("#productDetailModal").classList.remove("hidden");
}

function closeProductDetail() {
  $("#productDetailModal").classList.add("hidden");
}
function renderProductReviews(reviews = []) {
  if (!reviews.length) return "";
  const featured = reviews.slice(0, 2).map((review) => `
    <div class="review-chip">
      <span>"${escapeHtml(review.comment)}"</span>
      <strong>${escapeHtml(review.name)}</strong>
    </div>
  `).join("");
  return `<div class="product-reviews">${featured}</div>`;
}
function addToCart(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product || product.stock < 1) return;
  const line = state.cart.find((item) => item.productId === productId);
  if (line) line.quantity += 1;
  else state.cart.push({ productId, quantity: 1 });
  persistCart();
  toast(`${product.name} added to cart`);
}

function changeQuantity(productId, delta) {
  const line = state.cart.find((item) => item.productId === productId);
  if (!line) return;
  line.quantity += delta;
  if (line.quantity < 1) state.cart = state.cart.filter((item) => item.productId !== productId);
  persistCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.productId !== productId);
  persistCart();
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(currentCartTotal());
  $("#metricCart").textContent = money(currentCartTotal());
  const items = $("#cartItems");
  if (!state.cart.length) {
    items.innerHTML = `<div class="wide-panel">Your cart is empty.</div>`;
    return;
  }
  items.innerHTML = state.cart.map((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product) return "";
    return `
      <div class="cart-line">
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <div>${money(product.price)} each</div>
        </div>
        <div class="quantity-controls">
          <button type="button" onclick="changeQuantity('${item.productId}', -1)">-</button>
          <span>${item.quantity}</span>
          <button type="button" onclick="changeQuantity('${item.productId}', 1)">+</button>
        </div>
        <button class="danger-button" type="button" onclick="removeFromCart('${item.productId}')">Remove</button>
      </div>
    `;
  }).join("");
}

async function checkout(event) {
  event.preventDefault();
  if (!state.user) {
    openAuth("login");
    toast("Sign in before checkout.");
    return;
  }
  if (!state.cart.length) return toast("Add products to your cart first.");
  const body = {
    items: state.cart,
    paymentMethod: $("#paymentMethod").value,
    shippingAddress: {
      name: $("#shipName").value,
      address: $("#shipAddress").value,
      city: $("#shipCity").value
    }
  };
  const data = await api("/api/orders", { method: "POST", body });
  state.cart = [];
  persistCart();
  await loadProducts();
  $("#cartDrawer").classList.remove("open");
  if (data.checkoutUrl) {
    location.href = data.checkoutUrl;
  } else {
    toast(`Order ${data.order.id} placed.`);
    switchView("orders");
  }
}

async function loadOrders() {
  const list = $("#ordersList");
  if (!state.user) {
    list.innerHTML = `<div class="order-card">Sign in to track your orders.</div>`;
    return;
  }
  const data = await api("/api/orders");
  list.innerHTML = renderOrders(data.orders, false);
}

async function loadAdminOrders() {
  if (state.user?.role !== "admin") return;
  const data = await api("/api/orders");
  $("#adminOrderCount").textContent = `${data.orders.length} order${data.orders.length === 1 ? "" : "s"}`;
  $("#adminOrders").innerHTML = renderOrders(data.orders, true);
}

function renderOrders(orders, adminMode) {
  if (!orders.length) return `<div class="order-card">No orders yet.</div>`;
  return orders.map((order) => `
    <article class="order-card">
      <div class="order-line">
        <div>
          <strong>${order.id}</strong>
          <div>${new Date(order.createdAt).toLocaleString()}${adminMode ? ` | ${escapeHtml(order.customer.email)}` : ""}</div>
        </div>
        <span class="status">${escapeHtml(order.status)}</span>
      </div>
      <div class="order-items">
        ${order.items.map((item) => `<span>${item.quantity} x ${escapeHtml(item.name)} - ${money(item.subtotal)}</span>`).join("")}
      </div>
      <div class="timeline">
        ${order.timeline.map((item) => `<span class="pill">${escapeHtml(item.label)}</span>`).join("")}
      </div>
      <div class="order-line">
        <strong>${money(order.total)}</strong>
        ${adminMode ? `
          <select onchange="updateOrderStatus('${order.id}', this.value)">
            ${["Processing", "Packed", "Shipped", "Delivered", "Cancelled"].map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        ` : `<span>${escapeHtml(order.paymentProvider)} payment</span>`}
      </div>
    </article>
  `).join("");
}

async function updateOrderStatus(orderId, status) {
  await api(`/api/orders/${orderId}`, { method: "PUT", body: { status } });
  toast("Order status updated.");
  loadAdminOrders();
}

function renderAdminProducts() {
  $("#adminProductCount").textContent = `${state.products.length} product${state.products.length === 1 ? "" : "s"}`;
  $("#adminProducts").innerHTML = state.products.map((product) => `
    <div class="admin-product-row">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div>${escapeHtml(product.category)} | ${money(product.price)} | ${product.stock} stock</div>
      </div>
      <div class="row-actions">
        <button class="small-button" onclick="editProduct('${product.id}')">Edit</button>
        <button class="danger-button" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function editProduct(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return;
  state.editingProductId = productId;
  $("#formTitle").textContent = "Edit Product";
  $("#productId").value = product.id;
  $("#productName").value = product.name;
  $("#productCategory").value = product.category;
  $("#productDescription").value = product.description;
  $("#productPrice").value = product.price;
  $("#productStock").value = product.stock;
  $("#productRating").value = product.rating;
  $("#productTags").value = (product.tags || []).join(", ");
  $("#productImage").value = product.image;
}

function resetProductForm() {
  state.editingProductId = null;
  $("#formTitle").textContent = "Add Product";
  $("#productForm").reset();
  $("#productId").value = "";
  $("#productRating").value = "4.5";
}

async function saveProduct(event) {
  event.preventDefault();
  const body = {
    name: $("#productName").value,
    category: $("#productCategory").value,
    description: $("#productDescription").value,
    price: $("#productPrice").value,
    stock: Number($("#productStock").value),
    rating: $("#productRating").value,
    tags: $("#productTags").value,
    image: $("#productImage").value
  };
  const path = state.editingProductId ? `/api/products/${state.editingProductId}` : "/api/products";
  const method = state.editingProductId ? "PUT" : "POST";
  await api(path, { method, body });
  toast(state.editingProductId ? "Product updated." : "Product added.");
  resetProductForm();
  await loadProducts();
  renderAdminProducts();
}

async function deleteProduct(productId) {
  if (!confirm("Delete this product?")) return;
  await api(`/api/products/${productId}`, { method: "DELETE" });
  toast("Product deleted.");
  await loadProducts();
  renderAdminProducts();
}

async function uploadProductImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const data = await api("/api/uploads", { method: "POST", body: { dataUrl } });
  $("#productImage").value = data.url;
  toast("Image uploaded.");
}

function openAuth(mode = "login") {
  state.authMode = mode;
  $("#authModal").classList.remove("hidden");
  const isRegister = mode === "register";
  $("#authTitle").textContent = isRegister ? "Create account" : "Sign in";
  $("#authSubmit").textContent = isRegister ? "Create account" : "Sign in";
  $("#toggleAuthMode").textContent = isRegister ? "Already have an account? Sign in" : "Need an account? Create one";
  $$(".register-only").forEach((node) => node.classList.toggle("hidden", !isRegister));
}

async function submitAuth(event) {
  event.preventDefault();
  const body = {
    name: $("#authName").value,
    email: $("#authEmail").value,
    password: $("#authPassword").value
  };
  const path = state.authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  const data = await api(path, { method: "POST", body });
  state.user = data.user;
  $("#authModal").classList.add("hidden");
  updateAuthUI();
  toast(`Welcome, ${state.user.name}.`);
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  updateAuthUI();
  switchView("shop");
  toast("Signed out.");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function bindEvents() {
  $$(".nav-tab").forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));
  ["searchInput", "categorySelect", "priceRange", "ratingSelect", "stockCheckbox"].forEach((id) => {
    $(`#${id}`).addEventListener("input", () => {
      $("#priceLabel").textContent = money($("#priceRange").value);
      loadProducts().catch((error) => toast(error.message));
    });
  });
  $("#themeToggleButton").addEventListener("click", toggleTheme);
  $("#cartButton").addEventListener("click", () => $("#cartDrawer").classList.add("open"));
  $("#closeCartButton").addEventListener("click", () => $("#cartDrawer").classList.remove("open"));
  $("#checkoutForm").addEventListener("submit", (event) => checkout(event).catch((error) => toast(error.message)));
  $("#refreshOrdersButton").addEventListener("click", () => loadOrders().catch((error) => toast(error.message)));
  $("#authButton").addEventListener("click", () => state.user ? logout().catch((error) => toast(error.message)) : openAuth("login"));
  $("#closeAuthButton").addEventListener("click", () => $("#authModal").classList.add("hidden"));
  $("#closeProductDetailButton").addEventListener("click", closeProductDetail);
  $("#productDetailModal").addEventListener("click", (event) => { if (event.target.id === "productDetailModal") closeProductDetail(); });
  $("#toggleAuthMode").addEventListener("click", () => openAuth(state.authMode === "login" ? "register" : "login"));
  $("#authForm").addEventListener("submit", (event) => submitAuth(event).catch((error) => toast(error.message)));
  $("#productForm").addEventListener("submit", (event) => saveProduct(event).catch((error) => toast(error.message)));
  $("#resetProductForm").addEventListener("click", resetProductForm);
  $("#imageUpload").addEventListener("change", (event) => uploadProductImage(event).catch((error) => toast(error.message)));
}

async function init() {
  bindEvents();
  applyTheme(state.theme);
  document.querySelector("#copyrightYear").textContent = new Date().getFullYear();
  $("#priceLabel").textContent = money($("#priceRange").value);
  await loadMe();
  await loadProducts();
  const params = new URLSearchParams(location.search);
  if (params.get("order")) {
    toast(`Payment returned for ${params.get("order")}.`);
    switchView("orders");
  }
}

window.openProductDetail = openProductDetail;
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;

init().catch((error) => toast(error.message));






