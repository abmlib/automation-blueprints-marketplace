import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { validateDsl } from "../src";

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const TEMPLATE_FILES = [
  "webhook-to-action.yaml",
  "scheduled-sync.yaml",
  "event-chain.yaml",
  "approval-flow.yaml",
];

describe("DSL starter templates", () => {
  const loaded: Array<{ file: string; dsl: Record<string, unknown> }> = [];

  beforeAll(() => {
    for (const file of TEMPLATE_FILES) {
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8");
      const dsl = yaml.load(raw) as Record<string, unknown>;
      loaded.push({ file, dsl });
    }
  });

  it.each(TEMPLATE_FILES)("%s passes DSL schema validation", (file) => {
    const entry = loaded.find((e) => e.file === file)!;
    const result = validateDsl(entry.dsl);
    expect(result.ok).toBe(true);
    expect(result.errors ?? []).toEqual([]);
  });

  it.each(TEMPLATE_FILES)("%s has all required fields", (file) => {
    const { dsl } = loaded.find((e) => e.file === file)!;
    expect(dsl).toHaveProperty("id");
    expect(dsl).toHaveProperty("name");
    expect(dsl).toHaveProperty("version");
    expect(dsl).toHaveProperty("apps");
    expect(dsl).toHaveProperty("trigger");
    expect(dsl).toHaveProperty("steps");
  });

  it.each(TEMPLATE_FILES)("%s includes fixtures section", (file) => {
    const { dsl } = loaded.find((e) => e.file === file)!;
    expect(dsl).toHaveProperty("fixtures");
    expect(typeof dsl.fixtures).toBe("object");
    expect(Object.keys(dsl.fixtures as object).length).toBeGreaterThan(0);
  });

  it.each(TEMPLATE_FILES)("%s includes tests section", (file) => {
    const { dsl } = loaded.find((e) => e.file === file)!;
    expect(dsl).toHaveProperty("tests");
    expect(Array.isArray(dsl.tests)).toBe(true);
    const tests = dsl.tests as Array<{ name: string; input: unknown }>;
    expect(tests.length).toBeGreaterThanOrEqual(2);
    for (const t of tests) {
      expect(t).toHaveProperty("name");
      expect(t).toHaveProperty("input");
    }
  });

  it.each(TEMPLATE_FILES)("%s has at least one app and one step", (file) => {
    const { dsl } = loaded.find((e) => e.file === file)!;
    const apps = dsl.apps as string[];
    expect(apps.length).toBeGreaterThanOrEqual(1);
    const steps = dsl.steps as Array<{ id: string; app: string; action: string }>;
    expect(steps.length).toBeGreaterThanOrEqual(1);
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.app).toBeTruthy();
      expect(step.action).toBeTruthy();
    }
  });

  it.each(TEMPLATE_FILES)("%s has a valid semantic version", (file) => {
    const { dsl } = loaded.find((e) => e.file === file)!;
    expect(dsl.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it.each(TEMPLATE_FILES)("%s trigger has app and event", (file) => {
    const { dsl } = loaded.find((e) => e.file === file)!;
    const trigger = dsl.trigger as { app: string; event: string };
    expect(trigger.app).toBeTruthy();
    expect(trigger.event).toBeTruthy();
  });
});
