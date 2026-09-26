/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");

const port = 3317;
const baseUrl = `http://127.0.0.1:${port}`;
let server;

async function request(pathname, redirect = "follow") {
  return fetch(`${baseUrl}${pathname}`, { redirect });
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await request("/auth");
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("سرور Frontend در زمان مقرر آماده نشد.");
}

test.before(async () => {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `npm run start -- --port ${port}`]
      : ["run", "start", "--", "--port", String(port)];
  server = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });
  await waitForServer();
});

test.after(() => {
  if (!server || server.killed) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      stdio: "ignore",
    });
  } else {
    server.kill("SIGTERM");
  }
});

test("ناوبری واقعی صفحات عمومی HTML فارسی و RTL برمی‌گرداند", async () => {
  for (const pathname of [
    "/auth",
    "/products",
    "/products/not-found",
    "/quote-request",
    "/account",
    "/admin/login",
  ]) {
    const response = await request(pathname);
    assert.equal(response.status, 200, `${pathname} باید قابل نمایش باشد`);
    const html = await response.text();
    assert.match(html, /dir="rtl"/i, `${pathname} باید RTL باشد`);
    assert.doesNotMatch(
      html,
      /images\.unsplash\.com/i,
      `${pathname} نباید داده ساختگی Unsplash داشته باشد`,
    );
  }
});

test("Middleware قبل از نمایش پنل، کاربر ناشناس را به ورود مدیر هدایت می‌کند", async () => {
  const response = await request("/admin", "manual");
  assert.ok([301, 302, 307, 308].includes(response.status));
  assert.match(response.headers.get("location") || "", /\/admin\/login/);
});

test("صفحه 404 واقعی پیام فارسی و ساختار RTL دارد", async () => {
  const response = await request("/this-route-does-not-exist");
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.match(html, /dir="rtl"/i);
  assert.match(html, /یافت|صفحه|بازگشت/);
});
