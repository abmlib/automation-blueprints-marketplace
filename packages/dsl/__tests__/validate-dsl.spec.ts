import { validateDsl } from "../src";

describe("DSL validation", () => {
  const baseBlueprint = {
    id: "bp-1",
    name: "Test Blueprint",
    version: "0.1.0",
    apps: ["zapier"],
    scopes: ["crm"],
    trigger: { app: "zapier", event: "new_record" },
    retry: { attempts: 3, delayMs: 1000 },
    steps: [
      {
        id: "s1",
        app: "slack",
        action: "send_message",
        transforms: [
          { field: "text", operation: "uppercase" }
        ]
      },
    ],
  };

  it("passes on valid blueprint", () => {
    const result = validateDsl(baseBlueprint);
    expect(result.ok).toBe(true);
  });

  it("fails when retry.delayMs missing", () => {
    const invalid = { ...baseBlueprint, retry: { attempts: 3 } } as any;
    const result = validateDsl(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors?.some((e) => e.includes("delayMs"))).toBe(true);
  });
});
