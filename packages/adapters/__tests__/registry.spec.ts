import { AdapterRegistry } from "../index";

describe("AdapterRegistry", () => {
  it("returns zapier adapter", () => {
    const adapter = AdapterRegistry.get("zapier");
    expect(adapter?.runtime).toBe("zapier");
    const sample = adapter?.toTargetFormat({ name: "BP", version: "0.1.0", trigger: { event: "new" } });
    expect(sample).toHaveProperty("triggers");
  });

  it("returns make adapter", () => {
    const adapter = AdapterRegistry.get("make");
    expect(adapter?.runtime).toBe("make");
    const sample = adapter?.toTargetFormat({
      name: "BP",
      version: "0.1.0",
      trigger: { app: "webhook", event: "new" },
      steps: [],
    });
    expect(sample).toHaveProperty("flow");
    expect(Array.isArray((sample as any).flow)).toBe(true);
  });

  it("returns n8n adapter", () => {
    const adapter = AdapterRegistry.get("n8n");
    expect(adapter?.runtime).toBe("n8n");
    const sample = adapter?.toTargetFormat({
      name: "BP",
      version: "0.1.0",
      trigger: { app: "webhook", event: "new" },
      steps: [],
    });
    expect(sample).toHaveProperty("nodes");
    expect(sample).toHaveProperty("connections");
  });

  it("returns power-automate adapter", () => {
    const adapter = AdapterRegistry.get("power-automate");
    expect(adapter?.runtime).toBe("power-automate");
    const sample = adapter?.toTargetFormat({
      name: "BP",
      trigger: { app: "http", event: "request" },
    });
    expect(sample).toHaveProperty("$schema");
    expect(sample).toHaveProperty("triggers");
    expect(sample).toHaveProperty("actions");
  });
});
