import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(root, "apps", "web", "out", "index.html");

await access(destination);

console.log("Firebase Hosting root is ready:", path.relative(root, destination));
