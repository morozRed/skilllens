import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "tests", "fixtures");
const dest = path.join(root, "dist", "tests", "fixtures");

await mkdir(path.dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
