// src/lib/ensure-upload-dir.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lib = path.resolve(__dirname, "..");
const root = path.resolve(lib, "..");
const uploadsDir = path.resolve(root, "uploads");
const usersDir = path.resolve(uploadsDir, "users");
const billboardsDir = path.join(uploadsDir, "billboards");
const productsDir = path.join(uploadsDir, "products");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

if (!fs.existsSync(billboardsDir)) {
  fs.mkdirSync(billboardsDir, { recursive: true });
}

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

export { usersDir, billboardsDir, productsDir };
