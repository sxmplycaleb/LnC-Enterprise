const assert = require("assert");
const { spawn } = require("child_process");

const BASE = "http://localhost:3100";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${data.error || response.statusText}`);
  }
  return data;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await request("/api/products");
      return;
    } catch {
      await wait(250);
    }
  }
  throw new Error("Server did not become ready.");
}

async function main() {
  const server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "3100", APP_URL: BASE },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stderr = "";
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();
    const catalog = await request("/api/products");
    assert(catalog.products.length >= 1, "Expected seeded products");

    const login = await request("/api/auth/login", {
      method: "POST",
      body: { email: "admin@demo.com", password: "Admin123!" }
    });
    assert(login.token, "Expected JWT token");
    assert.equal(login.user.role, "admin");

    const created = await request("/api/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${login.token}` },
      body: {
        name: "Smoke Test Product",
        category: "QA",
        description: "Temporary product created by smoke test.",
        price: 10,
        stock: 3,
        rating: 4.2,
        tags: "test",
        image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=900&q=80"
      }
    });
    assert(created.product.id, "Expected created product id");

    const order = await request("/api/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${login.token}` },
      body: {
        paymentMethod: "demo",
        items: [{ productId: created.product.id, quantity: 1 }],
        shippingAddress: { name: "Smoke Test", address: "1 Test Way", city: "Nairobi" }
      }
    });
    assert(order.order.id, "Expected order id");

    await request(`/api/products/${created.product.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${login.token}` }
    });

    console.log("Smoke test passed: catalog, JWT login, admin CRUD, and checkout are working.");
  } finally {
    server.kill();
    if (stderr) process.stderr.write(stderr);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
