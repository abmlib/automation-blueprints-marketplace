import { Command } from "commander";
import { validateDsl } from "@automation-blueprints/dsl";
import { readDslFile } from "../dsl-file";

export function registerValidate(program: Command): void {
  program
    .command("validate")
    .description("Validate a DSL file locally without uploading")
    .argument("<file>", "Path to a DSL file (YAML or JSON)")
    .action((file: string) => {
      let dsl: unknown;
      try {
        dsl = readDslFile(file);
      } catch (err) {
        console.error(
          `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exitCode = 1;
        return;
      }

      const result = validateDsl(dsl);

      if (result.ok) {
        console.log("Validation passed.");
        if (result.warnings && result.warnings.length > 0) {
          console.log("\nWarnings:");
          for (const w of result.warnings) {
            console.log(`  - ${w}`);
          }
        }
      } else {
        console.error("Validation failed.\n");
        if (result.errors) {
          console.error("Errors:");
          for (const e of result.errors) {
            console.error(`  - ${e}`);
          }
        }
        process.exitCode = 1;
      }
    });
}
