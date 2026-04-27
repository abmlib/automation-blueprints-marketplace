import { AdapterRegistry } from "../index";
import * as path from "path";
import * as fs from "fs";

const canonicalBlueprint = JSON.parse(
  fs.readFileSync(
    path.resolve(
      __dirname,
      "../../../examples/blueprints/intermediate/stripe-invoice-notifications.json",
    ),
    "utf-8",
  ),
);

describe("PowerAutomateAdapter", () => {
  const adapter = AdapterRegistry.get("power-automate")!;

  it("is registered with runtime 'power-automate'", () => {
    expect(adapter).toBeDefined();
    expect(adapter.runtime).toBe("power-automate");
  });

  describe("toTargetFormat", () => {
    it("maps trigger app 'http' to Request type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "incoming" },
        steps: [],
      });

      expect(result.triggers.incoming.type).toBe("Request");
    });

    it("maps trigger app 'webhook' to HttpWebhook type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "hook" },
        steps: [],
      });

      expect(result.triggers.hook.type).toBe("HttpWebhook");
    });

    it("maps trigger app 'recurrence' to Recurrence type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "recurrence", event: "schedule" },
        steps: [],
      });

      expect(result.triggers.schedule.type).toBe("Recurrence");
    });

    it("defaults unknown trigger apps to Request type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [],
      });

      expect(result.triggers["invoice.created"].type).toBe("Request");
    });

    it("defaults undefined trigger app to Request type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { event: "evt" },
        steps: [],
      });

      expect(result.triggers.evt.type).toBe("Request");
    });

    it("sets trigger kind to Http and provides schema/method inputs", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "incoming" },
        steps: [],
      });

      const trigger = result.triggers.incoming;
      expect(trigger.kind).toBe("Http");
      expect(trigger.inputs).toEqual({ schema: {}, method: "POST" });
    });

    it("uses trigger.event as the trigger key name", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "my-custom-trigger" },
        steps: [],
      });

      expect(Object.keys(result.triggers)).toEqual(["my-custom-trigger"]);
    });

    it("maps http app to Http action type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "call-api", app: "http", action: "request", inputs: { url: "https://api.com" } }],
      });

      expect(result.actions["call-api"].type).toBe("Http");
    });

    it("maps 'compose' action to Compose action type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "merge", app: "data", action: "compose", inputs: {} }],
      });

      expect(result.actions.merge.type).toBe("Compose");
    });

    it("defaults other apps/actions to ApiConnection type", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: {} },
          { id: "s2", app: "sharepoint", action: "create_item", inputs: {} },
        ],
      });

      expect(result.actions.s1.type).toBe("ApiConnection");
      expect(result.actions.s2.type).toBe("ApiConnection");
    });

    it("sets first action runAfter to empty object", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "s1", app: "slack", action: "send", inputs: {} }],
      });

      expect(result.actions.s1.runAfter).toEqual({});
    });

    it("chains runAfter dependencies sequentially across steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "step-a", app: "slack", action: "send", inputs: {} },
          { id: "step-b", app: "email", action: "send", inputs: {} },
          { id: "step-c", app: "teams", action: "post", inputs: {} },
        ],
      });

      expect(result.actions["step-a"].runAfter).toEqual({});
      expect(result.actions["step-b"].runAfter).toEqual({
        "step-a": ["Succeeded"],
      });
      expect(result.actions["step-c"].runAfter).toEqual({
        "step-b": ["Succeeded"],
      });
    });

    it("passes step.inputs as action inputs, defaulting to empty object", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "slack", action: "send", inputs: { channel: "#ops" } },
          { id: "s2", app: "tool", action: "run" },
        ],
      });

      expect(result.actions.s1.inputs).toEqual({ channel: "#ops" });
      expect(result.actions.s2.inputs).toEqual({});
    });

    it("converts step transforms to Compose actions with correct runAfter", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          {
            id: "process",
            app: "tool",
            action: "run",
            inputs: {},
            transforms: [
              { field: "name", operation: "toUpper" },
              { field: "email", operation: "toLower" },
            ],
          },
        ],
      });

      expect(result.actions["process_Transform_0"]).toEqual({
        type: "Compose",
        inputs: "@{toUpper(body('process')?['name'])}",
        runAfter: { process: ["Succeeded"] },
      });

      expect(result.actions["process_Transform_1"]).toEqual({
        type: "Compose",
        inputs: "@{toLower(body('process')?['email'])}",
        runAfter: { process: ["Succeeded"] },
      });
    });

    it("does not create Compose actions when step has no transforms", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "s1", app: "slack", action: "send", inputs: {} }],
      });

      const actionKeys = Object.keys(result.actions);
      expect(actionKeys).toEqual(["s1"]);
    });

    it("subsequent step runAfter depends on step ID, not transform actions", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          {
            id: "first",
            app: "tool",
            action: "run",
            inputs: {},
            transforms: [{ field: "x", operation: "trim" }],
          },
          { id: "second", app: "slack", action: "send", inputs: {} },
        ],
      });

      expect(result.actions.second.runAfter).toEqual({
        first: ["Succeeded"],
      });
    });

    it("handles empty steps with no actions", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [],
      });

      expect(result.actions).toEqual({});
    });

    it("produces correct schema envelope", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "evt" },
        steps: [],
      });

      expect(result.$schema).toBe(
        "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
      );
      expect(result.contentVersion).toBe("1.0.0.0");
      expect(result.parameters).toEqual({});
      expect(result.outputs).toEqual({});
    });

    it("converts the canonical invoice-notification blueprint correctly", () => {
      const result: any = adapter.toTargetFormat(canonicalBlueprint);

      expect(result.$schema).toBe(
        "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
      );
      expect(result.contentVersion).toBe("1.0.0.0");
      expect(result.parameters).toEqual({});
      expect(result.outputs).toEqual({
        "format-message_formatted_text": {
          type: "string",
          value: "@actions('format-message').outputs.body.formatted_text",
        },
      });

      expect(Object.keys(result.triggers)).toEqual(["invoice.created"]);
      expect(result.triggers["invoice.created"]).toEqual({
        type: "Request",
        kind: "Http",
        inputs: { schema: {}, method: "POST" },
      });

      expect(Object.keys(result.actions)).toEqual([
        "format-message",
        "send-notification",
      ]);

      expect(result.actions["format-message"]).toEqual({
        type: "ApiConnection",
        inputs: canonicalBlueprint.steps[0].inputs,
        runAfter: {},
      });

      expect(result.actions["send-notification"]).toEqual({
        type: "ApiConnection",
        inputs: canonicalBlueprint.steps[1].inputs,
        runAfter: { "format-message": ["Succeeded"] },
      });
    });
  });

  describe("detectUnsupportedFeatures", () => {
    it("returns empty array when DSL has no unsupported features", () => {
      expect(
        adapter.detectUnsupportedFeatures!({
          name: "Simple",
          trigger: { app: "http", event: "incoming" },
          steps: [{ id: "s1", app: "slack", action: "send" }],
        }),
      ).toEqual([]);
    });

    it("warns about scopes when present", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["read"],
        trigger: { app: "http", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("scopes");
      expect(warnings[0]).toContain("Power Automate");
    });

    it("does not warn about retry (Power Automate supports it natively via retryPolicy)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 3, delayMs: 1000 },
        trigger: { app: "http", event: "evt" },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("warns about policies when present", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        policies: { logging: true },
        trigger: { app: "http", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("policies");
      expect(warnings[0]).toContain("Power Automate");
    });

    it("does not warn about trigger filters (Power Automate supports them natively via trigger conditions)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: {
          app: "http",
          event: "evt",
          filters: [{ field: "status", operator: "equals", value: 200 }],
        },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("does not warn about step-level condition (Power Automate supports it natively via If actions)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", condition: '{{steps.prev.status}} === "ok"' },
        ],
      });
      expect(warnings.some((w: string) => w.toLowerCase().includes("condition"))).toBe(false);
    });

    it("does not warn about step-level outputs (Power Automate supports them natively via workflow outputs)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", outputs: ["result"] },
        ],
      });
      expect(warnings.some((w: string) => w.toLowerCase().includes("outputs"))).toBe(false);
    });

    it("accumulates multiple warnings for multiple unsupported features", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["admin"],
        retry: { attempts: 2, delayMs: 500 },
        policies: { logging: true },
        trigger: {
          app: "http",
          event: "evt",
          filters: [{ field: "x", operator: "eq", value: 1 }],
        },
        steps: [
          { id: "s1", app: "a", action: "b", condition: "true", outputs: ["r"] },
        ],
      });
      expect(warnings).toHaveLength(2);
    });

    it("does not warn about empty scopes, policies, or filters", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: [],
        policies: {},
        trigger: { app: "http", event: "evt", filters: [] },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });
  });

  describe("trigger filter mapping", () => {
    it("maps a single filter to trigger conditions with equals expression", () => {
      const result: any = adapter.toTargetFormat({
        name: "Filter Test",
        trigger: {
          app: "http",
          event: "incoming",
          filters: [{ field: "status", operator: "equals", value: "active" }],
        },
        steps: [],
      });

      const trigger = result.triggers.incoming;
      expect(trigger.conditions).toEqual([
        { expression: "@equals(triggerOutputs()?['body/status'], 'active')" },
      ]);
    });

    it("maps multiple filters to multiple trigger conditions", () => {
      const result: any = adapter.toTargetFormat({
        name: "Multi-Filter",
        trigger: {
          app: "http",
          event: "incoming",
          filters: [
            { field: "status", operator: "equals", value: "active" },
            { field: "score", operator: "gte", value: 50 },
          ],
        },
        steps: [],
      });

      const trigger = result.triggers.incoming;
      expect(trigger.conditions).toEqual([
        { expression: "@equals(triggerOutputs()?['body/status'], 'active')" },
        { expression: "@greaterOrEquals(triggerOutputs()?['body/score'], 50)" },
      ]);
    });

    it("maps DSL operators to correct Logic Apps expression functions", () => {
      const cases: Array<{ operator: string; field: string; value: unknown; expected: string }> = [
        { operator: "equals", field: "f", value: "v", expected: "@equals(triggerOutputs()?['body/f'], 'v')" },
        { operator: "eq", field: "f", value: "v", expected: "@equals(triggerOutputs()?['body/f'], 'v')" },
        { operator: "not_equals", field: "f", value: "v", expected: "@not(equals(triggerOutputs()?['body/f'], 'v'))" },
        { operator: "neq", field: "f", value: "v", expected: "@not(equals(triggerOutputs()?['body/f'], 'v'))" },
        { operator: "contains", field: "f", value: "v", expected: "@contains(triggerOutputs()?['body/f'], 'v')" },
        { operator: "gt", field: "n", value: 10, expected: "@greater(triggerOutputs()?['body/n'], 10)" },
        { operator: "gte", field: "n", value: 10, expected: "@greaterOrEquals(triggerOutputs()?['body/n'], 10)" },
        { operator: "lt", field: "n", value: 10, expected: "@less(triggerOutputs()?['body/n'], 10)" },
        { operator: "lte", field: "n", value: 10, expected: "@lessOrEquals(triggerOutputs()?['body/n'], 10)" },
      ];

      cases.forEach(({ operator, field, value, expected }) => {
        const result: any = adapter.toTargetFormat({
          name: "Op Test",
          trigger: {
            app: "http",
            event: "evt",
            filters: [{ field, operator, value }],
          },
          steps: [],
        });

        expect(result.triggers.evt.conditions[0].expression).toBe(expected);
      });
    });

    it("falls back to @equals for unknown operators", () => {
      const result: any = adapter.toTargetFormat({
        name: "Unknown Op",
        trigger: {
          app: "http",
          event: "evt",
          filters: [{ field: "f", operator: "custom_op", value: "v" }],
        },
        steps: [],
      });

      expect(result.triggers.evt.conditions[0].expression).toBe(
        "@equals(triggerOutputs()?['body/f'], 'v')",
      );
    });

    it("quotes string values and leaves numeric values unquoted in expressions", () => {
      const result: any = adapter.toTargetFormat({
        name: "Value Types",
        trigger: {
          app: "http",
          event: "evt",
          filters: [
            { field: "name", operator: "equals", value: "John" },
            { field: "age", operator: "gt", value: 25 },
          ],
        },
        steps: [],
      });

      const conditions = result.triggers.evt.conditions;
      expect(conditions[0].expression).toBe(
        "@equals(triggerOutputs()?['body/name'], 'John')",
      );
      expect(conditions[1].expression).toBe(
        "@greater(triggerOutputs()?['body/age'], 25)",
      );
    });

    it("does not add conditions when filters array is empty", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Filters",
        trigger: { app: "http", event: "evt", filters: [] },
        steps: [],
      });

      expect(result.triggers.evt).not.toHaveProperty("conditions");
    });

    it("does not add conditions when filters are absent", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Filters",
        trigger: { app: "http", event: "evt" },
        steps: [],
      });

      expect(result.triggers.evt).not.toHaveProperty("conditions");
    });

    it("emits no warning when filters are present and mapped", () => {
      const dsl = {
        name: "Filter Warn Test",
        trigger: {
          app: "http",
          event: "evt",
          filters: [{ field: "status", operator: "equals", value: "active" }],
        },
        steps: [{ id: "s1", app: "slack", action: "send", inputs: {} }],
      };

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("filter"))).toBe(false);
    });

    it("preserves other trigger properties when conditions are added", () => {
      const result: any = adapter.toTargetFormat({
        name: "Preserve Props",
        trigger: {
          app: "webhook",
          event: "hook",
          filters: [{ field: "status", operator: "eq", value: "ok" }],
        },
        steps: [],
      });

      const trigger = result.triggers.hook;
      expect(trigger.type).toBe("HttpWebhook");
      expect(trigger.kind).toBe("Http");
      expect(trigger.inputs).toEqual({ schema: {}, method: "POST" });
      expect(trigger.conditions).toEqual([
        { expression: "@equals(triggerOutputs()?['body/status'], 'ok')" },
      ]);
    });
  });

  describe("retry mapping", () => {
    it("maps retry config to retryPolicy on every action and emits no warning", () => {
      const dsl = {
        name: "Retry Test",
        trigger: { app: "http", event: "incoming" },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: { channel: "#ops" } },
          { id: "s2", app: "email", action: "send_email", inputs: { to: "a@b.com" } },
        ],
        retry: { attempts: 3, delayMs: 5000 },
      };

      const result: any = adapter.toTargetFormat(dsl);

      const expectedRetryPolicy = {
        type: "fixed",
        count: 3,
        interval: "PT5S",
      };

      expect(result.actions.s1.retryPolicy).toEqual(expectedRetryPolicy);
      expect(result.actions.s2.retryPolicy).toEqual(expectedRetryPolicy);

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("retry"))).toBe(false);
    });

    it("rounds up sub-second delayMs to 1 second in ISO 8601 interval", () => {
      const result: any = adapter.toTargetFormat({
        name: "Sub-second",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do", inputs: {} }],
        retry: { attempts: 2, delayMs: 500 },
      });

      expect(result.actions.s1.retryPolicy).toEqual({
        type: "fixed",
        count: 2,
        interval: "PT1S",
      });
    });

    it("does not add retryPolicy when retry is absent", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Retry",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do", inputs: {} }],
      });

      expect(result.actions.s1).not.toHaveProperty("retryPolicy");
    });
  });

  describe("step output mapping", () => {
    it("maps step.outputs to workflow-level outputs referencing action outputs", () => {
      const result: any = adapter.toTargetFormat({
        name: "Output Test",
        trigger: { app: "http", event: "incoming" },
        steps: [
          {
            id: "process-data",
            app: "tool",
            action: "run",
            inputs: {},
            outputs: ["result", "status"],
          },
        ],
      });

      expect(result.outputs).toEqual({
        "process-data_result": {
          type: "string",
          value: "@actions('process-data').outputs.body.result",
        },
        "process-data_status": {
          type: "string",
          value: "@actions('process-data').outputs.body.status",
        },
      });
    });

    it("produces empty outputs when no steps have outputs", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Outputs",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b", inputs: {} }],
      });

      expect(result.outputs).toEqual({});
    });

    it("produces empty outputs when step.outputs is an empty array", () => {
      const result: any = adapter.toTargetFormat({
        name: "Empty Outputs",
        trigger: { app: "http", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b", inputs: {}, outputs: [] }],
      });

      expect(result.outputs).toEqual({});
    });

    it("aggregates outputs from multiple steps into workflow-level outputs", () => {
      const result: any = adapter.toTargetFormat({
        name: "Multi-Step Outputs",
        trigger: { app: "http", event: "incoming" },
        steps: [
          { id: "step-a", app: "a", action: "x", inputs: {}, outputs: ["alpha"] },
          { id: "step-b", app: "b", action: "y", inputs: {} },
          { id: "step-c", app: "c", action: "z", inputs: {}, outputs: ["beta", "gamma"] },
        ],
      });

      expect(result.outputs).toEqual({
        "step-a_alpha": {
          type: "string",
          value: "@actions('step-a').outputs.body.alpha",
        },
        "step-c_beta": {
          type: "string",
          value: "@actions('step-c').outputs.body.beta",
        },
        "step-c_gamma": {
          type: "string",
          value: "@actions('step-c').outputs.body.gamma",
        },
      });
    });

    it("emits no warning when step.outputs are present and mapped", () => {
      const dsl = {
        name: "Output Warn Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "tool", action: "run", outputs: ["result"] },
        ],
      };

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("outputs"))).toBe(false);
    });

    it("preserves retryPolicy on actions when outputs are present", () => {
      const result: any = adapter.toTargetFormat({
        name: "Output + Retry",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", inputs: {}, outputs: ["result"] },
        ],
        retry: { attempts: 3, delayMs: 2000 },
      });

      expect(result.outputs).toEqual({
        "s1_result": {
          type: "string",
          value: "@actions('s1').outputs.body.result",
        },
      });
      expect(result.actions.s1.retryPolicy).toBeDefined();
    });
  });

  describe("canHandle", () => {
    it("returns true for a valid DSL without policies", () => {
      expect(
        adapter.canHandle!({
          name: "Simple",
          trigger: { app: "http", event: "incoming" },
          steps: [{ id: "s1", app: "slack", action: "send" }],
        }),
      ).toBe(true);
    });

    it("returns true when policies is an empty object", () => {
      expect(
        adapter.canHandle!({
          policies: {},
          trigger: { app: "http", event: "evt" },
          steps: [],
        }),
      ).toBe(true);
    });

    it("returns false when policies has entries", () => {
      expect(
        adapter.canHandle!({
          policies: { rateLimit: { maxPerMinute: 10 } },
          trigger: { app: "http", event: "evt" },
          steps: [],
        }),
      ).toBe(false);
    });

    it("returns true when steps are absent", () => {
      expect(adapter.canHandle!({})).toBe(true);
    });

    it("returns true for blueprints with scopes (scopes are not structural)", () => {
      expect(
        adapter.canHandle!({
          scopes: ["read", "write"],
          trigger: { app: "http", event: "evt" },
          steps: [],
        }),
      ).toBe(true);
    });

    it("returns true for blueprints with conditions (Power Automate supports them via If actions)", () => {
      expect(
        adapter.canHandle!({
          trigger: { app: "http", event: "evt" },
          steps: [
            { id: "s1", app: "a", action: "b" },
            { id: "s2", app: "c", action: "d", condition: '{{steps.s1.ok}} === "yes"' },
          ],
        }),
      ).toBe(true);
    });

    it("returns true for blueprints with retry (Power Automate supports it via retryPolicy)", () => {
      expect(
        adapter.canHandle!({
          retry: { attempts: 3, delayMs: 5000 },
          trigger: { app: "http", event: "evt" },
          steps: [],
        }),
      ).toBe(true);
    });
  });

  describe("step condition mapping", () => {
    it("maps step.condition to an If action wrapping the step's action", () => {
      const result: any = adapter.toTargetFormat({
        name: "Condition Test",
        trigger: { app: "http", event: "incoming" },
        steps: [
          { id: "kyc-check", app: "sumsub", action: "create_applicant", inputs: { userId: "123" } },
          {
            id: "create-contract",
            app: "pandadoc",
            action: "create_document",
            condition: '{{steps.kyc-check.status}} === "approved"',
            inputs: { template_id: "tpl-1" },
          },
        ],
      });

      expect(result.actions).not.toHaveProperty("create-contract");
      expect(result.actions).toHaveProperty("Condition_create-contract");

      const ifAction = result.actions["Condition_create-contract"];
      expect(ifAction.type).toBe("If");
      expect(ifAction.expression).toBe(
        "@equals(actions('kyc-check').outputs.body.status, 'approved')",
      );
      expect(ifAction.actions["create-contract"]).toBeDefined();
      expect(ifAction.actions["create-contract"].type).toBe("ApiConnection");
      expect(ifAction.actions["create-contract"].inputs).toEqual({ template_id: "tpl-1" });
      expect(ifAction.actions["create-contract"].runAfter).toEqual({});
      expect(ifAction.else).toEqual({ actions: {} });
    });

    it("sets If action runAfter to previous step and subsequent step runAfter to If", () => {
      const result: any = adapter.toTargetFormat({
        name: "Chain Test",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "step-a", app: "a", action: "do", inputs: {} },
          {
            id: "step-b",
            app: "b",
            action: "run",
            condition: '{{steps.step-a.result}} === "ok"',
            inputs: {},
          },
          { id: "step-c", app: "c", action: "finish", inputs: {} },
        ],
      });

      expect(result.actions["step-a"].runAfter).toEqual({});
      expect(result.actions["Condition_step-b"].runAfter).toEqual({
        "step-a": ["Succeeded"],
      });
      expect(result.actions["step-c"].runAfter).toEqual({
        "Condition_step-b": ["Succeeded"],
      });
    });

    it("places transforms inside the If action scope for conditional steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Transforms Inside If",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "process",
            app: "tool",
            action: "run",
            condition: '{{steps.prev.ok}} === true',
            inputs: {},
            transforms: [
              { field: "name", operation: "toUpper" },
            ],
          },
        ],
      });

      const ifAction = result.actions["Condition_process"];
      expect(ifAction.actions).toHaveProperty("process");
      expect(ifAction.actions).toHaveProperty("process_Transform_0");
      expect(ifAction.actions["process_Transform_0"]).toEqual({
        type: "Compose",
        inputs: "@{toUpper(body('process')?['name'])}",
        runAfter: { process: ["Succeeded"] },
      });

      expect(result.actions).not.toHaveProperty("process_Transform_0");
    });

    it("applies retryPolicy to the action inside the If scope", () => {
      const result: any = adapter.toTargetFormat({
        name: "Retry + Condition",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "cond-step",
            app: "b",
            action: "y",
            condition: '{{steps.prev.score}} >= 50',
            inputs: {},
          },
        ],
        retry: { attempts: 3, delayMs: 2000 },
      });

      const ifAction = result.actions["Condition_cond-step"];
      expect(ifAction.actions["cond-step"].retryPolicy).toEqual({
        type: "fixed",
        count: 3,
        interval: "PT2S",
      });
    });

    it("maps various condition operators to correct Logic Apps expressions", () => {
      const cases: Array<{
        operator: string;
        value: unknown;
        expected: string;
      }> = [
        { operator: "===", value: '"yes"', expected: "@equals(actions('prev').outputs.body.f, 'yes')" },
        { operator: "!==", value: '"no"', expected: "@not(equals(actions('prev').outputs.body.f, 'no'))" },
        { operator: ">", value: "10", expected: "@greater(actions('prev').outputs.body.f, 10)" },
        { operator: ">=", value: "5", expected: "@greaterOrEquals(actions('prev').outputs.body.f, 5)" },
        { operator: "<", value: "100", expected: "@less(actions('prev').outputs.body.f, 100)" },
        { operator: "<=", value: "50", expected: "@lessOrEquals(actions('prev').outputs.body.f, 50)" },
      ];

      cases.forEach(({ operator, value, expected }) => {
        const result: any = adapter.toTargetFormat({
          name: "Op Test",
          trigger: { app: "http", event: "evt" },
          steps: [
            { id: "prev", app: "a", action: "x", inputs: {} },
            {
              id: "s1",
              app: "b",
              action: "y",
              condition: `{{steps.prev.f}} ${operator} ${value}`,
              inputs: {},
            },
          ],
        });

        expect(result.actions["Condition_s1"].expression).toBe(expected);
      });
    });

    it("still produces workflow-level outputs for conditional steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Outputs + Condition",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "cond-step",
            app: "b",
            action: "y",
            condition: '{{steps.prev.done}} === true',
            inputs: {},
            outputs: ["result"],
          },
        ],
      });

      expect(result.outputs).toEqual({
        "cond-step_result": {
          type: "string",
          value: "@actions('cond-step').outputs.body.result",
        },
      });
    });

    it("treats unparseable conditions as unconditional steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Unparseable",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", condition: "some-arbitrary-string", inputs: {} },
        ],
      });

      expect(result.actions).toHaveProperty("s1");
      expect(result.actions).not.toHaveProperty("Condition_s1");
      expect(result.actions.s1.type).toBe("ApiConnection");
    });

    it("handles multiple conditional steps in sequence", () => {
      const result: any = adapter.toTargetFormat({
        name: "Multi-Condition",
        trigger: { app: "http", event: "evt" },
        steps: [
          { id: "step1", app: "a", action: "x", inputs: {} },
          {
            id: "step2",
            app: "b",
            action: "y",
            condition: '{{steps.step1.ok}} === true',
            inputs: {},
          },
          {
            id: "step3",
            app: "c",
            action: "z",
            condition: '{{steps.step1.score}} > 80',
            inputs: {},
          },
        ],
      });

      expect(result.actions).toHaveProperty("step1");
      expect(result.actions).toHaveProperty("Condition_step2");
      expect(result.actions).toHaveProperty("Condition_step3");

      expect(result.actions["Condition_step2"].runAfter).toEqual({
        step1: ["Succeeded"],
      });
      expect(result.actions["Condition_step3"].runAfter).toEqual({
        "Condition_step2": ["Succeeded"],
      });
    });
  });
});
