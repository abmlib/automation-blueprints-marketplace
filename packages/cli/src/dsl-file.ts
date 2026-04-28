import * as fs from "fs";
import * as path from "path";
import { parse as parseYaml } from "yaml";

export function readDslFile(filePath: string): unknown {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  const ext = path.extname(resolved).toLowerCase();

  if (ext === ".json") {
    return JSON.parse(raw);
  }

  if (ext === ".yaml" || ext === ".yml") {
    return parseYaml(raw);
  }

  // Attempt YAML first (superset of JSON), then JSON as fallback
  try {
    return parseYaml(raw);
  } catch {
    return JSON.parse(raw);
  }
}
