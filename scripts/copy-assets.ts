import fs from "fs";
import path from "path";

const source = path.resolve(__dirname, "..", "src", "data", "cards.json");
const target = path.resolve(__dirname, "..", "dist", "data", "cards.json");

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log(`Copied cards.json to ${target}`);
