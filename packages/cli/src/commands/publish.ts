import { Command } from "commander";
import { validateDsl } from "@automation-blueprints/dsl";
import { readDslFile } from "../dsl-file";
import { apiRequest } from "../api-client";

interface DslObject {
  id?: string;
  name?: string;
  version?: string;
  apps?: string[];
  [key: string]: unknown;
}

interface CheckSlugResponse {
  available: boolean;
}

interface CreateBlueprintResponse {
  id: string;
  slug: string;
}

interface AddVersionResponse {
  id: string;
  semver: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function registerPublish(program: Command): void {
  program
    .command("publish")
    .description(
      "Validate a DSL file locally and publish it to ABMLib",
    )
    .argument("<file>", "Path to a DSL file (YAML or JSON)")
    .option("--title <title>", "Blueprint title (defaults to DSL name)")
    .option("--slug <slug>", "Blueprint slug (defaults to slugified title)")
    .option("--summary <summary>", "Short summary")
    .option("--description <md>", "Markdown description")
    .option("--changelog <md>", "Changelog for this version")
    .action(async (file: string, opts: Record<string, string | undefined>) => {
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

      // Local validation
      const validation = validateDsl(dsl);
      if (!validation.ok) {
        console.error("Local validation failed:\n");
        if (validation.errors) {
          for (const e of validation.errors) {
            console.error(`  - ${e}`);
          }
        }
        process.exitCode = 1;
        return;
      }
      console.log("Local validation passed.");

      const dslObj = dsl as DslObject;
      const title = opts.title ?? dslObj.name ?? "Untitled Blueprint";
      const slug = opts.slug ?? slugify(title);
      const semver = dslObj.version ?? "1.0.0";
      const apps = dslObj.apps ?? [];
      const summary =
        opts.summary ?? `Automation blueprint: ${title}`;
      const descriptionMd =
        opts.description ?? `# ${title}\n\nPublished via ABMLib CLI.`;

      // Check if slug already exists
      const slugCheck = await apiRequest<CheckSlugResponse>(
        "POST",
        "/blueprints/check-slug",
        { slug },
      );

      if (!slugCheck.ok) {
        console.error(`Error checking slug: ${slugCheck.error}`);
        process.exitCode = 1;
        return;
      }

      const isNewBlueprint = slugCheck.data?.available ?? true;

      if (isNewBlueprint) {
        console.log(`Creating new blueprint "${title}" (${slug})...`);

        const createResult = await apiRequest<CreateBlueprintResponse>(
          "POST",
          "/blueprints",
          {
            title,
            slug,
            summary,
            descriptionMd,
            apps,
            tags: [],
            semver,
            dslJson: dsl,
          },
        );

        if (!createResult.ok) {
          console.error(`Failed to create blueprint: ${createResult.error}`);
          process.exitCode = 1;
          return;
        }

        console.log(`Blueprint created successfully.`);
        console.log(`  Slug: ${createResult.data?.slug}`);
        console.log(`  Version: ${semver}`);
      } else {
        console.log(
          `Blueprint "${slug}" already exists. Adding version ${semver}...`,
        );

        const versionResult = await apiRequest<AddVersionResponse>(
          "POST",
          `/blueprints/${slug}/versions`,
          {
            semver,
            dslJson: dsl,
            changelogMd: opts.changelog,
          },
        );

        if (!versionResult.ok) {
          console.error(`Failed to add version: ${versionResult.error}`);
          process.exitCode = 1;
          return;
        }

        console.log(`Version ${semver} published successfully.`);
      }
    });
}
