import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".abmlib");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_API_URL = "https://abmlib.dev/api/v1";

export interface CliConfig {
  apiToken?: string;
  apiUrl?: string;
}

export function readConfig(): CliConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: CliConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

export function resolveToken(): string | null {
  const envToken = process.env.ABMLIB_API_TOKEN;
  if (envToken) {
    return envToken;
  }
  const config = readConfig();
  return config.apiToken ?? null;
}

export function resolveApiUrl(): string {
  const envUrl = process.env.ABMLIB_API_URL;
  if (envUrl) {
    return envUrl;
  }
  const config = readConfig();
  return config.apiUrl ?? DEFAULT_API_URL;
}

export { CONFIG_DIR, CONFIG_FILE };
