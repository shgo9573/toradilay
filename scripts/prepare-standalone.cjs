const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, ".next", "standalone");
const target = path.join(root, "standalone");

if (!fs.existsSync(path.join(source, "server.js"))) {
  console.error("Next.js standalone output was not found. Ensure next.config.ts has output: 'standalone'.");
  process.exit(1);
}
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(target, ".next", "static");
if (fs.existsSync(staticSource)) {
  fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
  fs.cpSync(staticSource, staticTarget, { recursive: true });
}
const publicSource = path.join(root, "public");
if (fs.existsSync(publicSource)) fs.cpSync(publicSource, path.join(target, "public"), { recursive: true });
console.log("Prepared Next.js standalone app at", target);
