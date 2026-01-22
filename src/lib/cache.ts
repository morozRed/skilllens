import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileExists } from "./fs.js";
import { cachePath } from "./paths.js";

const CACHE_VERSION = 1;

type CacheEntry = {
  hash: string;
  verdict: string;
  risk?: number;
  summary?: string;
  issues?: { title?: string; severity?: string; evidence?: string }[];
  auditedAt?: string;
};

type CacheState = {
  version: number;
  entries: Record<string, CacheEntry>;
};

async function readCache(): Promise<CacheState> {
  const filePath = cachePath();
  if (!(await fileExists(filePath))) {
    return { version: CACHE_VERSION, entries: {} };
  }
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { version: CACHE_VERSION, entries: {} };
    }
    if (parsed.version !== CACHE_VERSION || typeof parsed.entries !== "object") {
      return { version: CACHE_VERSION, entries: {} };
    }
    return parsed;
  } catch (err) {
    return { version: CACHE_VERSION, entries: {} };
  }
}

async function writeCache(cache: CacheState) {
  const filePath = cachePath();
  const payload = JSON.stringify(cache, null, 2) + "\n";
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, payload, "utf8");
}

function cacheKeyForSkill(skillPath) {
  return skillPath;
}

export {
  CACHE_VERSION,
  readCache,
  writeCache,
  cacheKeyForSkill,
  type CacheEntry,
  type CacheState
};
