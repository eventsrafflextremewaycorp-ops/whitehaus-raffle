// Copies the production build (dist/) into ../backend/public so Laravel serves the site and the API
// from one domain. Laravel's own files (index.php, .htaccess, robots.txt) are never overwritten.
import { cp, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const target = fileURLToPath(new URL("../../backend/public", import.meta.url));
const keep = new Set(["index.php", ".htaccess", "robots.txt", "favicon.ico"]);

for (const name of await readdir(dist)) {
  if (keep.has(name)) continue;
  await cp(path.join(dist, name), path.join(target, name), { recursive: true, force: true });
}
console.log(`Copied the build into ${target}`);
