import { Command } from "commander";
import * as readline from "readline";
import { readConfig, writeConfig } from "../config";

export function registerLogin(program: Command): void {
  program
    .command("login")
    .description("Store an API token for authenticating with ABMLib")
    .argument("[token]", "API token (if omitted, will be read from stdin)")
    .option("--api-url <url>", "Override the API base URL")
    .action(async (tokenArg: string | undefined, opts: { apiUrl?: string }) => {
      let token = tokenArg;

      if (!token) {
        token = await promptForToken();
      }

      if (!token || !token.trim()) {
        console.error("Error: No token provided.");
        process.exitCode = 1;
        return;
      }

      token = token.trim();

      if (!token.startsWith("api-key_")) {
        console.error(
          'Error: Invalid token format. API tokens start with "api-key_".',
        );
        process.exitCode = 1;
        return;
      }

      const existing = readConfig();
      writeConfig({
        ...existing,
        apiToken: token,
        ...(opts.apiUrl ? { apiUrl: opts.apiUrl } : {}),
      });

      console.log("Login successful. Token stored in ~/.abmlib/config.json");
    });
}

function promptForToken(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    rl.question("Enter your API token: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
