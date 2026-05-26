const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const PORT = Number(process.env.PORT || 3000);
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-before-production";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    writeDb(seedDatabase());
  }
}

function curatedProducts(now) {
  return [
    {
      id: id("prod"),
      name: "Aurora Knit Runner",
      category: "Footwear",
      description: "Lightweight everyday sneakers with breathable knit uppers and responsive foam.",
      price: 89,
      stock: 26,
      rating: 4.7,
      tags: ["sneakers", "running", "lightweight"],
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Maya", comment: "Soft from the first wear and light enough for long errands." },
        { name: "Jonah", comment: "The knit upper breathes well without feeling flimsy." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Nomad Canvas Pack",
      category: "Bags",
      description: "Weather-resistant backpack with padded laptop storage and quick-access pockets.",
      price: 118,
      stock: 14,
      rating: 4.8,
      tags: ["travel", "laptop", "canvas"],
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Brian", comment: "Looks clean in the office and still handles weekend trips." },
        { name: "Amani", comment: "The side pockets are exactly where I need them." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Pulse Wireless Headphones",
      category: "Electronics",
      description: "Noise-isolating over-ear headphones with 36-hour battery life and fast charging.",
      price: 149,
      stock: 21,
      rating: 4.6,
      tags: ["audio", "wireless", "headphones"],
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Noel", comment: "Battery lasted through work, commute, and a late-night playlist." },
        { name: "Ivy", comment: "The sound is warm and the cushions are easy on the ears." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Forge Steel Bottle",
      category: "Home",
      description: "Insulated stainless bottle that keeps drinks cold for 24 hours or hot for 12.",
      price: 34,
      stock: 42,
      rating: 4.5,
      tags: ["bottle", "insulated", "outdoors"],
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Leah", comment: "No leaks in my bag, and the finish still looks new." },
        { name: "Sam", comment: "Keeps water cold all afternoon in the sun." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Studio Desk Lamp",
      category: "Home",
      description: "Dimmable aluminum desk lamp with warm and cool lighting modes.",
      price: 64,
      stock: 18,
      rating: 4.4,
      tags: ["lighting", "desk", "workspace"],
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Nia", comment: "The warm setting makes late work sessions feel calmer." },
        { name: "Eli", comment: "Solid base, clean silhouette, and no glare." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Summit Shell Jacket",
      category: "Apparel",
      description: "Packable water-resistant shell for commute, trail, and travel.",
      price: 132,
      stock: 11,
      rating: 4.9,
      tags: ["jacket", "outdoor", "rain"],
      image: "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Zuri", comment: "Light enough to carry, protective enough for sudden rain." },
        { name: "Theo", comment: "The cut looks sharp without feeling restrictive." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Velvet Ember Hoodie",
      category: "Apparel",
      description: "Heavyweight fleece hoodie with a soft brushed interior and deep pink trim.",
      price: 76,
      stock: 30,
      rating: 4.8,
      tags: ["hoodie", "fleece", "streetwear"],
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Talia", comment: "The fabric feels premium and the color detail pops." },
        { name: "Micah", comment: "Warm without being bulky. Easy favorite." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Driftline Cargo Trousers",
      category: "Apparel",
      description: "Relaxed utility trousers with clean pockets, tapered cuffs, and everyday stretch.",
      price: 92,
      stock: 17,
      rating: 4.6,
      tags: ["cargo", "utility", "trousers"],
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Kai", comment: "The pockets are useful without making the pants look busy." },
        { name: "Mila", comment: "Great fit for travel days and casual dinners." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Northline Weekender",
      category: "Bags",
      description: "Structured overnight duffel with a shoe pocket, soft handles, and cabin-friendly size.",
      price: 128,
      stock: 13,
      rating: 4.9,
      tags: ["duffel", "weekend", "travel"],
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Renee", comment: "Fits two days of clothes and still slides under a seat." },
        { name: "Owen", comment: "The separate shoe pocket is a small luxury." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Echo Mini Speaker",
      category: "Electronics",
      description: "Compact wireless speaker with rich mids, splash resistance, and loop carry strap.",
      price: 58,
      stock: 25,
      rating: 4.5,
      tags: ["speaker", "portable", "wireless"],
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Dani", comment: "Small enough for my desk but loud enough for a room." },
        { name: "Ken", comment: "Pairing was quick and the strap is handy." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Halo Ceramic Mug",
      category: "Home",
      description: "Wide-handle ceramic mug with a matte glaze and comfortable 420 ml capacity.",
      price: 22,
      stock: 48,
      rating: 4.7,
      tags: ["mug", "ceramic", "coffee"],
      image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Sasha", comment: "Feels handmade, and the handle is actually comfortable." },
        { name: "Imani", comment: "My morning coffee looks better in it." }
      ],
      createdAt: now
    },
    {
      id: id("prod"),
      name: "Cove Linen Throw",
      category: "Home",
      description: "Textured linen-blend throw blanket with breathable weight and softly fringed edges.",
      price: 69,
      stock: 20,
      rating: 4.8,
      tags: ["throw", "linen", "decor"],
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80",
      reviews: [
        { name: "Elena", comment: "Adds texture to the sofa without feeling heavy." },
        { name: "Jude", comment: "Soft, breathable, and the color is easy to style." }
      ],
      createdAt: now
    }
  ];
}
function seedDatabase() {
  const now = new Date().toISOString();
  const admin = createUser("admin@demo.com", "Admin123!", "Avery Admin", "admin");
  const customer = createUser("customer@demo.com", "Customer123!", "Casey Customer", "customer");
  return {
    users: [admin, customer],
    products: curatedProducts(now),
    orders: []
  };
}

function readDb() {
  ensureStorage();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), candidate);
}

function createUser(email, password, name, role = "customer") {
  return {
    id: id("user"),
    email: email.toLowerCase(),
    name,
    role,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(payload) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }));
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  if (!token) return null;
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function getAuth(req) {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  const token = bearer || parseCookies(req).token;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const db = readDb();
  const user = db.users.find((item) => item.id === payload.sub);
  return user || null;
}

function sendJson(res, status, data, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function requireUser(req, res) {
  const user = getAuth(req);
  if (!user) sendError(res, 401, "Please sign in to continue.");
  return user;
}

function requireAdmin(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    sendError(res, 403, "Admin access required.");
    return null;
  }
  return user;
}

function productFromInput(input, existing = {}) {
  const price = Number(input.price);
  const stock = Number(input.stock);
  if (!input.name || !input.category || !input.description) throw new Error("Name, category, and description are required.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a positive number.");
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be a non-negative integer.");
  return {
    ...existing,
    name: String(input.name).trim(),
    category: String(input.category).trim(),
    description: String(input.description).trim(),
    price,
    stock,
    rating: Math.min(5, Math.max(0, Number(input.rating || existing.rating || 4.5))),
    tags: Array.isArray(input.tags) ? input.tags.map(String) : String(input.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    image: String(input.image || existing.image || "").trim(),
    updatedAt: new Date().toISOString()
  };
}

function filterProducts(products, params) {
  const search = (params.get("search") || "").toLowerCase();
  const category = params.get("category") || "all";
  const maxPrice = Number(params.get("maxPrice") || Infinity);
  const minRating = Number(params.get("minRating") || 0);
  const inStock = params.get("inStock") === "true";
  return products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.description} ${(product.tags || []).join(" ")}`.toLowerCase();
    return (!search || text.includes(search))
      && (category === "all" || product.category === category)
      && product.price <= maxPrice
      && product.rating >= minRating
      && (!inStock || product.stock > 0);
  });
}

function buildOrder(db, user, input) {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("Your cart is empty.");
  const lineItems = input.items.map((item) => {
    const product = db.products.find((entry) => entry.id === item.productId);
    const quantity = Number(item.quantity);
    if (!product) throw new Error("A product in your cart no longer exists.");
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Cart quantities must be whole numbers.");
    if (product.stock < quantity) throw new Error(`${product.name} only has ${product.stock} left in stock.`);
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
      subtotal: product.price * quantity
    };
  });
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = subtotal > 150 ? 0 : 12;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  const order = {
    id: id("ord"),
    userId: user.id,
    customer: publicUser(user),
    items: lineItems,
    shippingAddress: input.shippingAddress || {},
    subtotal,
    shipping,
    tax,
    total,
    status: "Processing",
    paymentStatus: "Paid",
    paymentProvider: input.paymentMethod === "stripe" ? "stripe" : "demo",
    timeline: [
      { label: "Order placed", at: new Date().toISOString() },
      { label: "Payment confirmed", at: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  };
  lineItems.forEach((lineItem) => {
    const product = db.products.find((entry) => entry.id === lineItem.productId);
    product.stock -= lineItem.quantity;
  });
  return order;
}

function stripeRequest(params) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(params);
    const req = https.request({
      hostname: "api.stripe.com",
      path: "/v1/checkout/sessions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body)
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(parsed.error?.message || "Stripe request failed"));
          else resolve(parsed);
        } catch {
          reject(new Error("Stripe returned an invalid response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function createStripeSession(order) {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const params = {
    mode: "payment",
    success_url: `${APP_URL}/?order=${order.id}`,
    cancel_url: `${APP_URL}/?checkout=cancelled`,
    client_reference_id: order.id
  };
  order.items.forEach((item, index) => {
    params[`line_items[${index}][quantity]`] = item.quantity;
    params[`line_items[${index}][price_data][currency]`] = "usd";
    params[`line_items[${index}][price_data][unit_amount]`] = Math.round(item.price * 100);
    params[`line_items[${index}][price_data][product_data][name]`] = item.name;
  });
  return stripeRequest(params);
}

function saveLocalUpload(dataUrl) {
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i.exec(dataUrl || "");
  if (!match) throw new Error("Upload must be a base64 image data URL.");
  const ext = match[1].split("/")[1].replace("jpeg", "jpg");
  const fileName = `${id("img")}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(match[2], "base64"));
  return `/uploads/${fileName}`;
}

async function uploadImage(input) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return saveLocalUpload(input.dataUrl);
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=ecommerce-demo&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");
  const boundary = `----codex${crypto.randomBytes(8).toString("hex")}`;
  const fields = {
    file: input.dataUrl,
    api_key: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder: "ecommerce-demo"
  };
  const body = Object.entries(fields).map(([key, value]) => (
    `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
  )).join("") + `--${boundary}--\r\n`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.cloudinary.com",
      path: `/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": Buffer.byteLength(body)
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(parsed.error?.message || "Cloudinary upload failed"));
          else resolve(parsed.secure_url);
        } catch {
          reject(new Error("Cloudinary returned an invalid response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function handleApi(req, res, url) {
  const db = readDb();
  const route = url.pathname;

  if (req.method === "POST" && route === "/api/auth/register") {
    const body = await readBody(req);
    if (!body.email || !body.password || !body.name) return sendError(res, 400, "Name, email, and password are required.");
    if (String(body.password).length < 8) return sendError(res, 400, "Password must be at least 8 characters.");
    if (db.users.some((user) => user.email === String(body.email).toLowerCase())) return sendError(res, 409, "That email is already registered.");
    const user = createUser(body.email, body.password, body.name);
    db.users.push(user);
    writeDb(db);
    const token = signJwt({ sub: user.id, role: user.role });
    return sendJson(res, 201, { user: publicUser(user), token }, { "Set-Cookie": `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` });
  }

  if (req.method === "POST" && route === "/api/auth/login") {
    const body = await readBody(req);
    const user = db.users.find((entry) => entry.email === String(body.email || "").toLowerCase());
    if (!user || !verifyPassword(body.password || "", user.passwordHash)) return sendError(res, 401, "Invalid email or password.");
    const token = signJwt({ sub: user.id, role: user.role });
    return sendJson(res, 200, { user: publicUser(user), token }, { "Set-Cookie": `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` });
  }

  if (req.method === "POST" && route === "/api/auth/logout") {
    return sendJson(res, 200, { ok: true }, { "Set-Cookie": "token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
  }

  if (req.method === "GET" && route === "/api/auth/me") {
    const user = getAuth(req);
    return sendJson(res, 200, { user: user ? publicUser(user) : null });
  }

  if (req.method === "GET" && route === "/api/products") {
    const products = filterProducts(db.products, url.searchParams);
    const categories = [...new Set(db.products.map((product) => product.category))].sort();
    return sendJson(res, 200, { products, categories });
  }

  if (req.method === "GET" && route.startsWith("/api/products/")) {
    const product = db.products.find((entry) => entry.id === route.split("/").pop());
    return product ? sendJson(res, 200, { product }) : sendError(res, 404, "Product not found.");
  }

  if (req.method === "POST" && route === "/api/products") {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const body = await readBody(req);
    const product = { id: id("prod"), ...productFromInput(body), createdAt: new Date().toISOString() };
    db.products.unshift(product);
    writeDb(db);
    return sendJson(res, 201, { product });
  }

  if (req.method === "PUT" && route.startsWith("/api/products/")) {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const productId = route.split("/").pop();
    const index = db.products.findIndex((entry) => entry.id === productId);
    if (index === -1) return sendError(res, 404, "Product not found.");
    const body = await readBody(req);
    db.products[index] = productFromInput(body, db.products[index]);
    writeDb(db);
    return sendJson(res, 200, { product: db.products[index] });
  }

  if (req.method === "DELETE" && route.startsWith("/api/products/")) {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const productId = route.split("/").pop();
    const before = db.products.length;
    db.products = db.products.filter((entry) => entry.id !== productId);
    if (db.products.length === before) return sendError(res, 404, "Product not found.");
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && route === "/api/uploads") {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const body = await readBody(req);
    const url = await uploadImage(body);
    return sendJson(res, 201, { url });
  }

  if (req.method === "POST" && route === "/api/orders") {
    const user = requireUser(req, res);
    if (!user) return;
    const body = await readBody(req);
    const order = buildOrder(db, user, body);
    const session = await createStripeSession(order);
    if (session?.url) {
      order.paymentStatus = "Pending";
      order.stripeSessionId = session.id;
    }
    db.orders.unshift(order);
    writeDb(db);
    return sendJson(res, 201, { order, checkoutUrl: session?.url || null });
  }

  if (req.method === "GET" && route === "/api/orders") {
    const user = requireUser(req, res);
    if (!user) return;
    const orders = user.role === "admin" ? db.orders : db.orders.filter((order) => order.userId === user.id);
    return sendJson(res, 200, { orders });
  }

  if (req.method === "PUT" && route.startsWith("/api/orders/")) {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const orderId = route.split("/").pop();
    const order = db.orders.find((entry) => entry.id === orderId);
    if (!order) return sendError(res, 404, "Order not found.");
    const body = await readBody(req);
    order.status = String(body.status || order.status);
    order.timeline.push({ label: `Status updated to ${order.status}`, at: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 200, { order });
  }

  sendError(res, 404, "API route not found.");
}

function serveStatic(req, res, url) {
  let filePath = url.pathname === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
  if (url.pathname.startsWith("/uploads/")) {
    filePath = path.join(UPLOAD_DIR, decodeURIComponent(url.pathname.replace("/uploads/", "")));
  }
  const normalized = path.normalize(filePath);
  const allowed = normalized.startsWith(PUBLIC_DIR) || normalized.startsWith(UPLOAD_DIR);
  if (!allowed || !fs.existsSync(normalized) || fs.statSync(normalized).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(normalized).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(normalized).pipe(res);
}

ensureStorage();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, APP_URL);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    sendError(res, 400, error.message || "Something went wrong.");
  }
});

server.listen(PORT, () => {
  console.log(`E-commerce platform running on ${APP_URL}`);
});

