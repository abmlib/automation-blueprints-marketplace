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

describe("N8nAdapter", () => {
  const adapter = AdapterRegistry.get("n8n")!;

  it("is registered with runtime 'n8n'", () => {
    expect(adapter).toBeDefined();
    expect(adapter.runtime).toBe("n8n");
  });

  describe("trigger type mapping", () => {
    it("maps webhook trigger.app to n8n-nodes-base.webhook", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "incoming" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.webhook");
      expect(triggerNode.name).toBe("Webhook");
      expect(triggerNode.webhookId).toBe("incoming");
      expect(triggerNode.parameters).toEqual({
        path: "/incoming",
        responseMode: "onReceived",
        options: {},
      });
    });

    it("maps http trigger.app to n8n-nodes-base.webhook", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "http", event: "request" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.webhook");
      expect(triggerNode.name).toBe("Webhook");
      expect(triggerNode.webhookId).toBe("request");
      expect(triggerNode.parameters.path).toBe("/request");
    });

    it("maps schedule trigger.app to n8n-nodes-base.scheduleTrigger", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "schedule", event: "hours" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.scheduleTrigger");
      expect(triggerNode.name).toBe("Schedule Trigger");
      expect(triggerNode.parameters).toEqual({
        rule: { interval: [{ field: "hours" }] },
      });
      expect(triggerNode).not.toHaveProperty("webhookId");
    });

    it("maps cron trigger.app to n8n-nodes-base.scheduleTrigger", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "cron", event: "minutes" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.scheduleTrigger");
      expect(triggerNode.name).toBe("Schedule Trigger");
      expect(triggerNode.parameters).toEqual({
        rule: { interval: [{ field: "minutes" }] },
      });
    });

    it("maps slack trigger.app to n8n-nodes-base.slackTrigger", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "slack", event: "message" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.slackTrigger");
      expect(triggerNode.name).toBe("Slack Trigger");
      expect(triggerNode.parameters).toEqual({ event: "message" });
      expect(triggerNode).not.toHaveProperty("webhookId");
    });

    it("maps github trigger.app to n8n-nodes-base.githubTrigger", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "github", event: "push" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.githubTrigger");
      expect(triggerNode.name).toBe("Github Trigger");
      expect(triggerNode.parameters).toEqual({ event: "push" });
    });

    it("maps stripe trigger.app to n8n-nodes-base.stripeTrigger", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.stripeTrigger");
      expect(triggerNode.name).toBe("Stripe Trigger");
      expect(triggerNode.parameters).toEqual({ event: "invoice.created" });
    });

    it("maps hubspot trigger.app to n8n-nodes-base.hubspotTrigger", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "hubspot", event: "contact.created" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.hubspotTrigger");
      expect(triggerNode.name).toBe("Hubspot Trigger");
      expect(triggerNode.parameters).toEqual({ event: "contact.created" });
    });

    it("maps any unknown app to n8n-nodes-base.<app>Trigger convention", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "customApp", event: "thing.happened" },
        steps: [],
      });

      const triggerNode = result.nodes[0];
      expect(triggerNode.type).toBe("n8n-nodes-base.customAppTrigger");
      expect(triggerNode.name).toBe("CustomApp Trigger");
      expect(triggerNode.parameters).toEqual({ event: "thing.happened" });
    });
  });

  describe("trigger filters mapping", () => {
    it("maps trigger.filters to conditions on app-specific triggers", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: {
          app: "github",
          event: "push",
          filters: [
            { field: "branch", operator: "equals", value: "main" },
            { field: "author", operator: "contains", value: "bot" },
          ],
        },
        steps: [],
      });

      expect(result.nodes[0].parameters).toEqual({
        event: "push",
        filters: {
          conditions: [
            { field: "branch", operation: "equals", value: "main" },
            { field: "author", operation: "contains", value: "bot" },
          ],
        },
      });
    });

    it("omits filters from parameters when trigger.filters is absent", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "slack", event: "message" },
        steps: [],
      });

      expect(result.nodes[0].parameters).toEqual({ event: "message" });
      expect(result.nodes[0].parameters).not.toHaveProperty("filters");
    });

    it("omits filters from parameters when trigger.filters is an empty array", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "slack", event: "message", filters: [] },
        steps: [],
      });

      expect(result.nodes[0].parameters).toEqual({ event: "message" });
      expect(result.nodes[0].parameters).not.toHaveProperty("filters");
    });

    it("does not map filters for webhook triggers", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: {
          app: "webhook",
          event: "incoming",
          filters: [{ field: "status", operator: "equals", value: 200 }],
        },
        steps: [],
      });

      expect(result.nodes[0].parameters).toEqual({
        path: "/incoming",
        responseMode: "onReceived",
        options: {},
      });
    });

    it("does not map filters for schedule triggers", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: {
          app: "schedule",
          event: "hours",
          filters: [{ field: "day", operator: "equals", value: "Monday" }],
        },
        steps: [],
      });

      expect(result.nodes[0].parameters).toEqual({
        rule: { interval: [{ field: "hours" }] },
      });
    });
  });

  describe("trigger node common properties", () => {
    it("always positions trigger node at [250, 300]", () => {
      for (const app of ["webhook", "schedule", "slack", "stripe"]) {
        const result: any = adapter.toTargetFormat({
          name: "Test",
          trigger: { app, event: "evt" },
          steps: [],
        });
        expect(result.nodes[0].position).toEqual([250, 300]);
      }
    });

    it("always sets typeVersion to 1", () => {
      for (const app of ["webhook", "schedule", "github"]) {
        const result: any = adapter.toTargetFormat({
          name: "Test",
          trigger: { app, event: "evt" },
          steps: [],
        });
        expect(result.nodes[0].typeVersion).toBe(1);
      }
    });

    it("only adds webhookId for webhook/http triggers", () => {
      const webhookResult: any = adapter.toTargetFormat({
        name: "T",
        trigger: { app: "webhook", event: "e" },
        steps: [],
      });
      expect(webhookResult.nodes[0].webhookId).toBe("e");

      const httpResult: any = adapter.toTargetFormat({
        name: "T",
        trigger: { app: "http", event: "e" },
        steps: [],
      });
      expect(httpResult.nodes[0].webhookId).toBe("e");

      for (const app of ["schedule", "slack", "github", "stripe"]) {
        const result: any = adapter.toTargetFormat({
          name: "T",
          trigger: { app, event: "e" },
          steps: [],
        });
        expect(result.nodes[0]).not.toHaveProperty("webhookId");
      }
    });
  });

  describe("toTargetFormat — step nodes", () => {
    it("maps steps to nodes with type n8n-nodes-base.{app}", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "send-msg", app: "slack", action: "send_message", inputs: { channel: "#general" } },
          { id: "create-row", app: "googleSheets", action: "append", inputs: { sheet: "data" } },
        ],
      });

      expect(result.nodes).toHaveLength(3);

      expect(result.nodes[1].name).toBe("send-msg");
      expect(result.nodes[1].type).toBe("n8n-nodes-base.slack");
      expect(result.nodes[1].parameters).toEqual({ channel: "#general" });

      expect(result.nodes[2].name).toBe("create-row");
      expect(result.nodes[2].type).toBe("n8n-nodes-base.googleSheets");
      expect(result.nodes[2].parameters).toEqual({ sheet: "data" });
    });

    it("positions step nodes at [250 + (index+1)*200, 300]", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b" },
          { id: "s2", app: "c", action: "d" },
          { id: "s3", app: "e", action: "f" },
        ],
      });

      expect(result.nodes[1].position).toEqual([450, 300]);
      expect(result.nodes[2].position).toEqual([650, 300]);
      expect(result.nodes[3].position).toEqual([850, 300]);
    });

    it("converts array transforms to n8n expression parameters", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "tool",
            action: "process",
            inputs: { base: "value" },
            transforms: [
              { field: "name", operation: "uppercase" },
              { field: "email", operation: "toLowerCase" },
            ],
          },
        ],
      });

      const params = result.nodes[1].parameters;
      expect(params.base).toBe("value");
      expect(params.name).toBe('={{ $json["name"].uppercase() }}');
      expect(params.email).toBe('={{ $json["email"].toLowerCase() }}');
    });

    it("skips transform entries missing field or operation", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "tool",
            action: "process",
            inputs: {},
            transforms: [
              { field: "name", operation: "uppercase" },
              { field: "", operation: "lowercase" },
              { field: "age", operation: "" },
              { operation: "trim" } as any,
            ],
          },
        ],
      });

      const params = result.nodes[1].parameters;
      expect(params.name).toBe('={{ $json["name"].uppercase() }}');
      expect(params).not.toHaveProperty("age");
      expect(Object.keys(params)).toEqual(["name"]);
    });

    it("does not apply transforms when transforms is not an array", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "tool",
            action: "do",
            inputs: { key: "val" },
            transforms: "not-an-array",
          },
        ],
      });

      expect(result.nodes[1].parameters).toEqual({ key: "val" });
    });

    it("defaults step parameters to inputs, falling back to empty object", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "noop" }],
      });

      expect(result.nodes[1].parameters).toEqual({});
    });
  });

  describe("toTargetFormat — connections", () => {
    it("wires trigger node to first step using dynamic trigger name", () => {
      const webhookResult: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [{ id: "step-one", app: "slack", action: "send" }],
      });
      expect(webhookResult.connections.Webhook.main).toEqual([
        [{ node: "step-one", type: "main", index: 0 }],
      ]);

      const slackResult: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "slack", event: "message" },
        steps: [{ id: "step-one", app: "http", action: "request" }],
      });
      expect(slackResult.connections["Slack Trigger"].main).toEqual([
        [{ node: "step-one", type: "main", index: 0 }],
      ]);
    });

    it("chains connections sequentially across multiple steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b" },
          { id: "s2", app: "c", action: "d" },
          { id: "s3", app: "e", action: "f" },
        ],
      });

      expect(result.connections.Webhook.main).toEqual([
        [{ node: "s1", type: "main", index: 0 }],
      ]);
      expect(result.connections.s1.main).toEqual([
        [{ node: "s2", type: "main", index: 0 }],
      ]);
      expect(result.connections.s2.main).toEqual([
        [{ node: "s3", type: "main", index: 0 }],
      ]);
      expect(result.connections).not.toHaveProperty("s3");
    });

    it("does not create forward connections from the last step", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [{ id: "only-step", app: "slack", action: "send" }],
      });

      expect(result.connections).not.toHaveProperty("only-step");
    });

    it("handles empty steps with an empty trigger connection array", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [],
      });

      expect(result.nodes).toHaveLength(1);
      expect(result.connections.Webhook.main).toEqual([[]]);
    });
  });

  describe("toTargetFormat — workflow metadata", () => {
    it("passes name from DSL and sets default workflow properties", () => {
      const result: any = adapter.toTargetFormat({
        name: "My Workflow",
        trigger: { app: "webhook", event: "evt" },
        steps: [],
      });

      expect(result.name).toBe("My Workflow");
      expect(result.active).toBe(false);
      expect(result.settings).toEqual({});
      expect(result.tags).toEqual([]);
    });
  });

  describe("detectUnsupportedFeatures", () => {
    it("returns empty array when DSL has no unsupported features", () => {
      expect(
        adapter.detectUnsupportedFeatures!({
          name: "Simple",
          trigger: { app: "slack", event: "message" },
          steps: [{ id: "s1", app: "slack", action: "send" }],
        }),
      ).toEqual([]);
    });

    it("warns about scopes when present", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["read", "write"],
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("scopes");
      expect(warnings[0]).toContain("n8n");
    });

    it("does not warn about retry when values are within n8n limits", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 3, delayMs: 1000 },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("warns about retry when attempts exceed n8n limit of 5", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 10, delayMs: 1000 },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("attempts was clamped to 5");
    });

    it("warns about retry when delayMs exceeds n8n limit of 5000", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 2, delayMs: 10000 },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("delayMs was clamped to 5000ms");
    });

    it("warns about both retry fields when both exceed n8n limits", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 10, delayMs: 10000 },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("attempts was clamped to 5");
      expect(warnings[0]).toContain("delayMs was clamped to 5000ms");
    });

    it("warns about policies when present", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        policies: { rateLimit: { maxPerMinute: 10 } },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("policies");
      expect(warnings[0]).toContain("n8n");
    });

    it("does not warn about step-level condition (n8n supports it natively via IF nodes)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b" },
          { id: "s2", app: "c", action: "d", condition: '{{steps.s1.status}} === "ok"' },
        ],
      });
      expect(warnings.some((w: string) => w.toLowerCase().includes("condition"))).toBe(false);
    });

    it("warns about step-level outputs and lists affected step IDs", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", outputs: ["result"] },
          { id: "s2", app: "c", action: "d" },
        ],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("outputs");
      expect(warnings[0]).toContain("s1");
      expect(warnings[0]).not.toContain("s2");
    });

    it("does not warn about filters on app-specific triggers (n8n maps them)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: {
          app: "github",
          event: "push",
          filters: [{ field: "branch", operator: "equals", value: "main" }],
        },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("warns about filters on webhook triggers", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: {
          app: "webhook",
          event: "incoming",
          filters: [{ field: "status", operator: "equals", value: 200 }],
        },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("filters");
      expect(warnings[0]).toContain("webhook");
    });

    it("warns about filters on schedule triggers", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: {
          app: "schedule",
          event: "hours",
          filters: [{ field: "day", operator: "equals", value: "Monday" }],
        },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("filters");
      expect(warnings[0]).toContain("schedule");
    });

    it("accumulates multiple warnings for multiple unsupported features", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["admin"],
        retry: { attempts: 2, delayMs: 500 },
        policies: { logging: true },
        trigger: {
          app: "webhook",
          event: "evt",
          filters: [{ field: "x", operator: "eq", value: 1 }],
        },
        steps: [
          { id: "s1", app: "a", action: "b", condition: "true", outputs: ["r"] },
        ],
      });
      expect(warnings).toHaveLength(4);
    });
  });

  describe("toTargetFormat — canonical blueprint", () => {
    it("converts the canonical invoice-notification blueprint with correct trigger type", () => {
      const result: any = adapter.toTargetFormat(canonicalBlueprint);

      expect(result.name).toBe("Invoice Created → Slack Notification");
      expect(result.active).toBe(false);
      expect(result.settings).toEqual({});
      expect(result.tags).toEqual([]);

      expect(result.nodes).toHaveLength(3);

      const [triggerNode, formatNode, notifyNode] = result.nodes;

      expect(triggerNode.name).toBe("Stripe Trigger");
      expect(triggerNode.type).toBe("n8n-nodes-base.stripeTrigger");
      expect(triggerNode.parameters).toEqual({ event: "invoice.created" });
      expect(triggerNode.position).toEqual([250, 300]);
      expect(triggerNode).not.toHaveProperty("webhookId");

      expect(formatNode.name).toBe("format-message");
      expect(formatNode.type).toBe("n8n-nodes-base.formatter");
      expect(formatNode.typeVersion).toBe(1);
      expect(formatNode.parameters).toEqual(canonicalBlueprint.steps[0].inputs);
      expect(formatNode.position).toEqual([450, 300]);

      expect(notifyNode.name).toBe("send-notification");
      expect(notifyNode.type).toBe("n8n-nodes-base.slack");
      expect(notifyNode.typeVersion).toBe(1);
      expect(notifyNode.parameters).toEqual(canonicalBlueprint.steps[1].inputs);
      expect(notifyNode.position).toEqual([650, 300]);

      expect(result.connections).toEqual({
        "Stripe Trigger": {
          main: [[{ node: "format-message", type: "main", index: 0 }]],
        },
        "format-message": {
          main: [[{ node: "send-notification", type: "main", index: 0 }]],
        },
      });
    });
  });

  describe("retry mapping", () => {
    it("maps retry config to action nodes with clamped values and emits no warning when within limits", () => {
      const dsl = {
        name: "Retry Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: {} },
          { id: "s2", app: "email", action: "send_email", inputs: {} },
        ],
        retry: { attempts: 3, delayMs: 5000 },
      };

      const result: any = adapter.toTargetFormat(dsl);

      const triggerNode = result.nodes[0];
      expect(triggerNode).not.toHaveProperty("retryOnFail");
      expect(triggerNode).not.toHaveProperty("maxTries");
      expect(triggerNode).not.toHaveProperty("waitBetweenTries");

      for (let i = 1; i < result.nodes.length; i++) {
        const node = result.nodes[i];
        expect(node.retryOnFail).toBe(true);
        expect(node.maxTries).toBe(3);
        expect(node.waitBetweenTries).toBe(5000);
      }

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("retry"))).toBe(false);
    });

    it("clamps retry values to n8n limits (5 tries, 5000ms)", () => {
      const result: any = adapter.toTargetFormat({
        name: "Clamped",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do", inputs: {} }],
        retry: { attempts: 10, delayMs: 10000 },
      });

      const actionNode = result.nodes[1];
      expect(actionNode.retryOnFail).toBe(true);
      expect(actionNode.maxTries).toBe(5);
      expect(actionNode.waitBetweenTries).toBe(5000);
    });

    it("does not add retry properties when retry is absent", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Retry",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do" }],
      });

      const actionNode = result.nodes[1];
      expect(actionNode).not.toHaveProperty("retryOnFail");
      expect(actionNode).not.toHaveProperty("maxTries");
      expect(actionNode).not.toHaveProperty("waitBetweenTries");
    });
  });

  describe("canHandle", () => {
    it("returns true for a valid DSL without policies", () => {
      expect(
        adapter.canHandle!({
          name: "Simple",
          trigger: { app: "webhook", event: "incoming" },
          steps: [{ id: "s1", app: "slack", action: "send" }],
        }),
      ).toBe(true);
    });

    it("returns true when policies is an empty object", () => {
      expect(
        adapter.canHandle!({
          policies: {},
          trigger: { app: "app", event: "evt" },
          steps: [],
        }),
      ).toBe(true);
    });

    it("returns false when policies has entries", () => {
      expect(
        adapter.canHandle!({
          policies: { rateLimit: { maxPerMinute: 10 } },
          trigger: { app: "app", event: "evt" },
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
          trigger: { app: "app", event: "evt" },
          steps: [],
        }),
      ).toBe(true);
    });

    it("returns true for blueprints with conditions (n8n supports them via IF nodes)", () => {
      expect(
        adapter.canHandle!({
          trigger: { app: "webhook", event: "evt" },
          steps: [
            { id: "s1", app: "a", action: "b" },
            { id: "s2", app: "c", action: "d", condition: '{{steps.s1.ok}} === "yes"' },
          ],
        }),
      ).toBe(true);
    });

    it("returns true for blueprints with retry (n8n supports it per-node)", () => {
      expect(
        adapter.canHandle!({
          retry: { attempts: 3, delayMs: 5000 },
          trigger: { app: "app", event: "evt" },
          steps: [],
        }),
      ).toBe(true);
    });
  });

  describe("step condition mapping", () => {
    it("inserts an IF node before a conditional step", () => {
      const result: any = adapter.toTargetFormat({
        name: "Condition Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "kyc-check", app: "sumsub", action: "check", inputs: {} },
          {
            id: "create-contract",
            app: "pandadoc",
            action: "create",
            condition: '{{steps.kyc-check.status}} === "approved"',
            inputs: { template: "tpl" },
          },
        ],
      });

      expect(result.nodes).toHaveLength(4);

      const ifNode = result.nodes[1];
      expect(ifNode).toBeUndefined;

      const nodes = result.nodes;
      const ifIdx = nodes.findIndex((n: any) => n.type === "n8n-nodes-base.if");
      expect(ifIdx).toBeGreaterThan(0);

      const ifN = nodes[ifIdx];
      expect(ifN.name).toBe("IF_create-contract");
      expect(ifN.type).toBe("n8n-nodes-base.if");
      expect(ifN.typeVersion).toBe(1);
      expect(ifN.parameters.conditions.string).toEqual([
        {
          value1: "={{ $node['kyc-check'].json.status }}",
          operation: "equal",
          value2: "approved",
        },
      ]);

      const condStep = nodes[ifIdx + 1];
      expect(condStep.name).toBe("create-contract");
      expect(condStep.type).toBe("n8n-nodes-base.pandadoc");
      expect(condStep.parameters).toEqual({ template: "tpl" });
    });

    it("wires IF true to conditional step and IF false to next step", () => {
      const result: any = adapter.toTargetFormat({
        name: "Wiring Test",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "step-a", app: "a", action: "x", inputs: {} },
          {
            id: "step-b",
            app: "b",
            action: "y",
            condition: '{{steps.step-a.ok}} === true',
            inputs: {},
          },
          { id: "step-c", app: "c", action: "z", inputs: {} },
        ],
      });

      expect(result.connections["Webhook"].main).toEqual([
        [{ node: "step-a", type: "main", index: 0 }],
      ]);

      expect(result.connections["step-a"].main).toEqual([
        [{ node: "IF_step-b", type: "main", index: 0 }],
      ]);

      expect(result.connections["IF_step-b"].main).toEqual([
        [{ node: "step-b", type: "main", index: 0 }],
        [{ node: "step-c", type: "main", index: 0 }],
      ]);

      expect(result.connections["step-b"].main).toEqual([
        [{ node: "step-c", type: "main", index: 0 }],
      ]);
    });

    it("wires IF false to empty array when conditional step is last", () => {
      const result: any = adapter.toTargetFormat({
        name: "Last Conditional",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "last",
            app: "b",
            action: "y",
            condition: '{{steps.prev.done}} === true',
            inputs: {},
          },
        ],
      });

      expect(result.connections["IF_last"].main).toEqual([
        [{ node: "last", type: "main", index: 0 }],
        [],
      ]);

      expect(result.connections).not.toHaveProperty("last");
    });

    it("maps numeric condition values to number-typed conditions", () => {
      const result: any = adapter.toTargetFormat({
        name: "Number Condition",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "cond",
            app: "b",
            action: "y",
            condition: "{{steps.prev.score}} > 80",
            inputs: {},
          },
        ],
      });

      const ifNode = result.nodes.find((n: any) => n.name === "IF_cond");
      expect(ifNode.parameters.conditions.number).toEqual([
        {
          value1: "={{ $node['prev'].json.score }}",
          operation: "larger",
          value2: 80,
        },
      ]);
    });

    it("maps boolean condition values to boolean-typed conditions", () => {
      const result: any = adapter.toTargetFormat({
        name: "Boolean Condition",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "cond",
            app: "b",
            action: "y",
            condition: "{{steps.prev.verified}} === true",
            inputs: {},
          },
        ],
      });

      const ifNode = result.nodes.find((n: any) => n.name === "IF_cond");
      expect(ifNode.parameters.conditions.boolean).toEqual([
        {
          value1: "={{ $node['prev'].json.verified }}",
          operation: "equal",
          value2: true,
        },
      ]);
    });

    it("applies retry properties to conditional step nodes", () => {
      const result: any = adapter.toTargetFormat({
        name: "Retry + Condition",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "cond",
            app: "b",
            action: "y",
            condition: '{{steps.prev.ok}} === "yes"',
            inputs: {},
          },
        ],
        retry: { attempts: 3, delayMs: 2000 },
      });

      const condNode = result.nodes.find((n: any) => n.name === "cond");
      expect(condNode.retryOnFail).toBe(true);
      expect(condNode.maxTries).toBe(3);
      expect(condNode.waitBetweenTries).toBe(2000);

      const ifNode = result.nodes.find((n: any) => n.name === "IF_cond");
      expect(ifNode).not.toHaveProperty("retryOnFail");
    });

    it("treats unparseable conditions as unconditional steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Unparseable",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", condition: "arbitrary-string", inputs: {} },
        ],
      });

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1].name).toBe("s1");
      expect(result.nodes[1].type).toBe("n8n-nodes-base.a");
      expect(result.nodes.find((n: any) => n.type === "n8n-nodes-base.if")).toBeUndefined();
    });

    it("handles consecutive conditional steps with correct wiring", () => {
      const result: any = adapter.toTargetFormat({
        name: "Consecutive Conditions",
        trigger: { app: "webhook", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "x", inputs: {} },
          {
            id: "s2",
            app: "b",
            action: "y",
            condition: '{{steps.s1.a}} === "v1"',
            inputs: {},
          },
          {
            id: "s3",
            app: "c",
            action: "z",
            condition: '{{steps.s1.b}} === "v2"',
            inputs: {},
          },
          { id: "s4", app: "d", action: "w", inputs: {} },
        ],
      });

      expect(result.connections["IF_s2"].main).toEqual([
        [{ node: "s2", type: "main", index: 0 }],
        [{ node: "IF_s3", type: "main", index: 0 }],
      ]);

      expect(result.connections["s2"].main).toEqual([
        [{ node: "IF_s3", type: "main", index: 0 }],
      ]);

      expect(result.connections["IF_s3"].main).toEqual([
        [{ node: "s3", type: "main", index: 0 }],
        [{ node: "s4", type: "main", index: 0 }],
      ]);

      expect(result.connections["s3"].main).toEqual([
        [{ node: "s4", type: "main", index: 0 }],
      ]);
    });
  });
});
