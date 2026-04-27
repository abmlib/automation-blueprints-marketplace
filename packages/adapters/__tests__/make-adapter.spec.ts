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

describe("MakeAdapter", () => {
  const adapter = AdapterRegistry.get("make")!;

  it("is registered with runtime 'make'", () => {
    expect(adapter).toBeDefined();
    expect(adapter.runtime).toBe("make");
  });

  describe("toTargetFormat", () => {
    it("formats trigger module as app:event", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [],
      });

      expect(result.flow[0].module).toBe("stripe:invoice.created");
    });

    it("sets trigger module version to 1 with empty parameters and mapper", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "github", event: "push" },
        steps: [],
      });

      const trigger = result.flow[0];
      expect(trigger.version).toBe(1);
      expect(trigger.parameters).toEqual({});
      expect(trigger.mapper).toEqual({});
    });

    it("includes expect metadata on trigger module", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [],
      });

      expect(result.flow[0].metadata.expect).toEqual([
        { name: "event", type: "text", label: "Event Type", required: false },
      ]);
    });

    it("maps steps to flow modules with sequential IDs starting at 2", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "webhook", event: "new" },
        steps: [
          {
            id: "s1",
            app: "slack",
            action: "send_message",
            inputs: { channel: "#general" },
          },
          {
            id: "s2",
            app: "email",
            action: "send_email",
            inputs: { to: "user@example.com" },
          },
        ],
      });

      expect(result.flow).toHaveLength(3);
      expect(result.flow[0].id).toBe(1);
      expect(result.flow[1].id).toBe(2);
      expect(result.flow[1].module).toBe("slack:send_message");
      expect(result.flow[1].parameters).toEqual({ channel: "#general" });
      expect(result.flow[2].id).toBe(3);
      expect(result.flow[2].module).toBe("email:send_email");
      expect(result.flow[2].parameters).toEqual({ to: "user@example.com" });
    });

    it("passes step.inputs as parameters, defaulting to empty object", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "noop" }],
      });

      expect(result.flow[1].parameters).toEqual({});
    });

    it("converts step.transforms array into a flat mapper object with Make expressions", () => {
      const transforms = [
        { field: "name", operation: "uppercase" },
        { field: "email", operation: "lowercase" },
      ];
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "tool", action: "format", transforms },
        ],
      });

      expect(result.flow[1].mapper).toEqual({
        name: "{{uppercase(name)}}",
        email: "{{lowercase(email)}}",
      });
    });

    it("includes the value in the Make expression when transform.value is present", () => {
      const transforms = [
        { field: "price", operation: "multiply", value: 100 },
        { field: "label", operation: "concat", value: "prefix-" },
      ];
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "tool", action: "calc", transforms },
        ],
      });

      expect(result.flow[1].mapper).toEqual({
        price: "{{multiply(100)}}",
        label: "{{concat(prefix-)}}",
      });
    });

    it("handles mixed transforms with and without value property", () => {
      const transforms = [
        { field: "name", operation: "uppercase" },
        { field: "amount", operation: "formatCurrency", value: "USD" },
        { field: "date", operation: "toISO" },
      ];
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "tool", action: "process", transforms },
        ],
      });

      expect(result.flow[1].mapper).toEqual({
        name: "{{uppercase(name)}}",
        amount: "{{formatCurrency(USD)}}",
        date: "{{toISO(date)}}",
      });
    });

    it("skips transform entries missing field or operation", () => {
      const transforms = [
        { field: "name", operation: "uppercase" },
        { field: "", operation: "lowercase" },
        { field: "email", operation: "" },
        { operation: "noop" } as any,
        { field: "ok", operation: "trim" },
      ];
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "tool", action: "clean", transforms },
        ],
      });

      expect(result.flow[1].mapper).toEqual({
        name: "{{uppercase(name)}}",
        ok: "{{trim(ok)}}",
      });
    });

    it("produces flat mapper object across multiple steps with transforms", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "tool",
            action: "a",
            transforms: [
              { field: "x", operation: "upper" },
              { field: "y", operation: "lower", value: "default" },
            ],
          },
          {
            id: "s2",
            app: "tool",
            action: "b",
            transforms: [{ field: "z", operation: "trim" }],
          },
        ],
      });

      expect(result.flow[1].mapper).toEqual({
        x: "{{upper(x)}}",
        y: "{{lower(default)}}",
      });
      expect(result.flow[2].mapper).toEqual({
        z: "{{trim(z)}}",
      });
    });

    it("defaults mapper to empty object when step has no transforms", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "tool", action: "do", inputs: { key: "val" } },
        ],
      });

      expect(result.flow[1].mapper).toEqual({});
    });

    it("defaults mapper to empty object when transforms is undefined", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do" }],
      });

      expect(result.flow[1].mapper).toEqual({});
    });

    it("positions trigger at (0, 0) and steps at (0, (index+1)*150)", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b" },
          { id: "s2", app: "c", action: "d" },
          { id: "s3", app: "e", action: "f" },
        ],
      });

      expect(result.flow[0].metadata.designer).toEqual({ x: 0, y: 0 });
      expect(result.flow[1].metadata.designer).toEqual({ x: 0, y: 150 });
      expect(result.flow[2].metadata.designer).toEqual({ x: 0, y: 300 });
      expect(result.flow[3].metadata.designer).toEqual({ x: 0, y: 450 });
    });

    it("step modules have restore metadata but no expect array", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b" }],
      });

      expect(result.flow[1].metadata.restore).toEqual({});
      expect(result.flow[1].metadata).not.toHaveProperty("expect");
    });

    it("passes name through from DSL", () => {
      const result: any = adapter.toTargetFormat({
        name: "My Scenario",
        trigger: { app: "app", event: "evt" },
        steps: [],
      });

      expect(result.name).toBe("My Scenario");
    });

    it("produces correct metadata block", () => {
      const result: any = adapter.toTargetFormat({
        name: "Test",
        trigger: { app: "app", event: "evt" },
        steps: [],
      });

      expect(result.metadata).toEqual({
        version: 1,
        scenario: { roundtrips: 1, maxErrors: 3 },
      });
    });

    it("handles empty steps array with only the trigger module", () => {
      const result: any = adapter.toTargetFormat({
        name: "Empty",
        trigger: { app: "webhook", event: "new" },
        steps: [],
      });

      expect(result.flow).toHaveLength(1);
      expect(result.flow[0].module).toBe("webhook:new");
    });

    it("converts the canonical invoice-notification blueprint correctly", () => {
      const result: any = adapter.toTargetFormat(canonicalBlueprint);

      expect(result.name).toBe("Invoice Created → Slack Notification");
      expect(result.flow).toHaveLength(3);

      const [trigger, formatStep, notifyStep] = result.flow;

      expect(trigger.id).toBe(1);
      expect(trigger.module).toBe("stripe:invoice.created");
      expect(trigger.version).toBe(1);
      expect(trigger.parameters).toEqual({});
      expect(trigger.mapper).toEqual({});
      expect(trigger.metadata.designer).toEqual({ x: 0, y: 0 });

      expect(formatStep.id).toBe(2);
      expect(formatStep.module).toBe("formatter:text_format");
      expect(formatStep.version).toBe(1);
      expect(formatStep.parameters).toEqual(canonicalBlueprint.steps[0].inputs);
      expect(formatStep.mapper).toEqual({});
      expect(formatStep.metadata.designer).toEqual({ x: 0, y: 150 });
      expect(formatStep.metadata.expect).toEqual([
        { name: "formatted_text", type: "text", label: "formatted_text", required: false },
      ]);

      expect(notifyStep.id).toBe(3);
      expect(notifyStep.module).toBe("slack:send_message");
      expect(notifyStep.version).toBe(1);
      expect(notifyStep.parameters).toEqual(canonicalBlueprint.steps[1].inputs);
      expect(notifyStep.mapper).toEqual({});
      expect(notifyStep.metadata.designer).toEqual({ x: 0, y: 300 });

      expect(result.metadata).toEqual({
        version: 1,
        scenario: { roundtrips: 1, maxErrors: 3 },
      });
    });
  });

  describe("detectUnsupportedFeatures", () => {
    it("returns empty array when DSL has no unsupported features", () => {
      expect(
        adapter.detectUnsupportedFeatures!({
          name: "Simple",
          trigger: { app: "webhook", event: "new" },
          steps: [{ id: "s1", app: "slack", action: "send_message" }],
        }),
      ).toEqual([]);
    });

    it("warns about scopes when present", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["read"],
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("scopes");
      expect(warnings[0]).toContain("Make");
    });

    it("does not warn about retry (Make supports it natively via onerror)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 3, delayMs: 1000 },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("warns about policies when present", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        policies: { key: "val" },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("policies");
      expect(warnings[0]).toContain("Make");
    });

    it("does not warn about trigger filters (Make supports them natively via BasicFilter)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: {
          app: "stripe",
          event: "invoice.created",
          filters: [{ field: "amount", operator: "gte", value: 100 }],
        },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("does not warn about step-level condition (Make supports it natively via Router modules)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", condition: '{{steps.prev.status}} === "ok"' },
        ],
      });
      expect(warnings.some((w: string) => w.toLowerCase().includes("condition"))).toBe(false);
    });

    it("does not warn about step-level outputs (Make supports them natively via metadata.expect)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "app", event: "evt" },
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
          app: "app",
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
        trigger: { app: "app", event: "evt", filters: [] },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });
  });

  describe("trigger filter mapping", () => {
    it("inserts a builtin:BasicFilter module between trigger and first step when filters are present", () => {
      const dsl = {
        name: "Filter Test",
        trigger: {
          app: "stripe",
          event: "invoice.created",
          filters: [{ field: "status", operator: "equals", value: "paid" }],
        },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: { channel: "#billing" } },
        ],
      };

      const result: any = adapter.toTargetFormat(dsl);

      expect(result.flow).toHaveLength(3);
      expect(result.flow[0].id).toBe(1);
      expect(result.flow[0].module).toBe("stripe:invoice.created");

      expect(result.flow[1].id).toBe(2);
      expect(result.flow[1].module).toBe("builtin:BasicFilter");
      expect(result.flow[1].version).toBe(1);
      expect(result.flow[1].mapper).toEqual({
        conditions: [[{
          a: "{{1.status}}",
          o: "text:equal",
          b: "paid",
        }]],
      });
      expect(result.flow[1].metadata.designer).toEqual({ x: 0, y: 75 });

      expect(result.flow[2].id).toBe(3);
      expect(result.flow[2].module).toBe("slack:send_message");
    });

    it("maps multiple filters as AND conditions in a single group", () => {
      const dsl = {
        name: "Multi-Filter",
        trigger: {
          app: "hubspot",
          event: "contact.created",
          filters: [
            { field: "lifecycle_stage", operator: "equals", value: "lead" },
            { field: "score", operator: "gte", value: 50 },
          ],
        },
        steps: [{ id: "s1", app: "slack", action: "send", inputs: {} }],
      };

      const result: any = adapter.toTargetFormat(dsl);
      const filterModule = result.flow[1];

      expect(filterModule.module).toBe("builtin:BasicFilter");
      expect(filterModule.mapper.conditions).toEqual([[
        { a: "{{1.lifecycle_stage}}", o: "text:equal", b: "lead" },
        { a: "{{1.score}}", o: "number:greaterequal", b: 50 },
      ]]);
    });

    it("maps DSL operators to correct Make operator strings", () => {
      const operators: Array<{ dsl: string; make: string }> = [
        { dsl: "equals", make: "text:equal" },
        { dsl: "eq", make: "text:equal" },
        { dsl: "not_equals", make: "text:notequal" },
        { dsl: "neq", make: "text:notequal" },
        { dsl: "contains", make: "text:contain" },
        { dsl: "gt", make: "number:greater" },
        { dsl: "gte", make: "number:greaterequal" },
        { dsl: "lt", make: "number:less" },
        { dsl: "lte", make: "number:lessequal" },
      ];

      operators.forEach(({ dsl: op, make }) => {
        const result: any = adapter.toTargetFormat({
          name: "Op Test",
          trigger: {
            app: "app",
            event: "evt",
            filters: [{ field: "f", operator: op, value: "v" }],
          },
          steps: [{ id: "s1", app: "a", action: "b" }],
        });

        expect(result.flow[1].mapper.conditions[0][0].o).toBe(make);
      });
    });

    it("falls back to text:<operator> for unknown operators", () => {
      const result: any = adapter.toTargetFormat({
        name: "Unknown Op",
        trigger: {
          app: "app",
          event: "evt",
          filters: [{ field: "f", operator: "custom_op", value: "v" }],
        },
        steps: [{ id: "s1", app: "a", action: "b" }],
      });

      expect(result.flow[1].mapper.conditions[0][0].o).toBe("text:custom_op");
    });

    it("adjusts step module IDs and y-positions when filter is inserted", () => {
      const result: any = adapter.toTargetFormat({
        name: "ID Offset",
        trigger: {
          app: "app",
          event: "evt",
          filters: [{ field: "x", operator: "eq", value: 1 }],
        },
        steps: [
          { id: "s1", app: "a", action: "b" },
          { id: "s2", app: "c", action: "d" },
        ],
      });

      expect(result.flow).toHaveLength(4);
      expect(result.flow[0].id).toBe(1);
      expect(result.flow[1].id).toBe(2);
      expect(result.flow[1].module).toBe("builtin:BasicFilter");
      expect(result.flow[2].id).toBe(3);
      expect(result.flow[2].module).toBe("a:b");
      expect(result.flow[2].metadata.designer).toEqual({ x: 0, y: 300 });
      expect(result.flow[3].id).toBe(4);
      expect(result.flow[3].module).toBe("c:d");
      expect(result.flow[3].metadata.designer).toEqual({ x: 0, y: 450 });
    });

    it("does not insert filter module when filters array is empty", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Filters",
        trigger: { app: "app", event: "evt", filters: [] },
        steps: [{ id: "s1", app: "a", action: "b" }],
      });

      expect(result.flow).toHaveLength(2);
      expect(result.flow[0].module).toBe("app:evt");
      expect(result.flow[1].module).toBe("a:b");
      expect(result.flow[1].id).toBe(2);
    });

    it("does not insert filter module when filters are absent", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Filters",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b" }],
      });

      expect(result.flow).toHaveLength(2);
      expect(result.flow[1].id).toBe(2);
    });

    it("emits no warning when filters are present and mapped", () => {
      const dsl = {
        name: "Filter Warn Test",
        trigger: {
          app: "stripe",
          event: "invoice.created",
          filters: [{ field: "amount", operator: "gte", value: 100 }],
        },
        steps: [{ id: "s1", app: "slack", action: "send", inputs: {} }],
      };

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("filter"))).toBe(false);
    });

    it("preserves onerror on filter module when retry is configured", () => {
      const dsl = {
        name: "Filter + Retry",
        trigger: {
          app: "stripe",
          event: "invoice.created",
          filters: [{ field: "status", operator: "equals", value: "paid" }],
        },
        steps: [{ id: "s1", app: "slack", action: "send", inputs: {} }],
        retry: { attempts: 3, delayMs: 2000 },
      };

      const result: any = adapter.toTargetFormat(dsl);
      const filterModule = result.flow[1];

      expect(filterModule.module).toBe("builtin:BasicFilter");
      expect(filterModule).not.toHaveProperty("onerror");
    });
  });

  describe("retry mapping", () => {
    it("maps retry config to onerror array on every flow module and emits no warning", () => {
      const dsl = {
        name: "Retry Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: { channel: "#ops" } },
          { id: "s2", app: "email", action: "send_email", inputs: { to: "a@b.com" } },
        ],
        retry: { attempts: 3, delayMs: 5000 },
      };

      const result: any = adapter.toTargetFormat(dsl);

      const expectedOnerror = [{
        module: "builtin:Retry",
        mapper: { count: "3", retry: true, interval: "5000" },
      }];

      expect(result.flow).toHaveLength(3);
      result.flow.forEach((mod: any) => {
        expect(mod.onerror).toEqual(expectedOnerror);
      });

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("retry"))).toBe(false);
    });

    it("does not add onerror when retry is absent", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Retry",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do" }],
      });

      result.flow.forEach((mod: any) => {
        expect(mod).not.toHaveProperty("onerror");
      });
    });
  });

  describe("step output mapping", () => {
    it("maps step.outputs to metadata.expect entries on the corresponding flow module", () => {
      const result: any = adapter.toTargetFormat({
        name: "Output Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          {
            id: "s1",
            app: "formatter",
            action: "text_format",
            inputs: { template: "hello" },
            outputs: ["formatted_text", "raw_text"],
          },
        ],
      });

      expect(result.flow[1].metadata.expect).toEqual([
        { name: "formatted_text", type: "text", label: "formatted_text", required: false },
        { name: "raw_text", type: "text", label: "raw_text", required: false },
      ]);
    });

    it("does not add expect to metadata when step has no outputs", () => {
      const result: any = adapter.toTargetFormat({
        name: "No Output",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b" }],
      });

      expect(result.flow[1].metadata).not.toHaveProperty("expect");
    });

    it("does not add expect to metadata when step.outputs is empty", () => {
      const result: any = adapter.toTargetFormat({
        name: "Empty Output",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b", outputs: [] }],
      });

      expect(result.flow[1].metadata).not.toHaveProperty("expect");
    });

    it("maps outputs independently per step in a multi-step blueprint", () => {
      const result: any = adapter.toTargetFormat({
        name: "Multi-Step Outputs",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "x", outputs: ["alpha"] },
          { id: "s2", app: "b", action: "y" },
          { id: "s3", app: "c", action: "z", outputs: ["beta", "gamma"] },
        ],
      });

      expect(result.flow[1].metadata.expect).toEqual([
        { name: "alpha", type: "text", label: "alpha", required: false },
      ]);
      expect(result.flow[2].metadata).not.toHaveProperty("expect");
      expect(result.flow[3].metadata.expect).toEqual([
        { name: "beta", type: "text", label: "beta", required: false },
        { name: "gamma", type: "text", label: "gamma", required: false },
      ]);
    });

    it("emits no warning when step.outputs are present and mapped", () => {
      const dsl = {
        name: "Output Warn Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          { id: "s1", app: "formatter", action: "text_format", outputs: ["formatted_text"] },
        ],
      };

      const warnings = adapter.detectUnsupportedFeatures!(dsl);
      expect(warnings.some((w: string) => w.toLowerCase().includes("outputs"))).toBe(false);
    });

    it("preserves expect entries alongside onerror when both outputs and retry are configured", () => {
      const result: any = adapter.toTargetFormat({
        name: "Output + Retry",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", outputs: ["result"] },
        ],
        retry: { attempts: 2, delayMs: 1000 },
      });

      expect(result.flow[1].metadata.expect).toEqual([
        { name: "result", type: "text", label: "result", required: false },
      ]);
      expect(result.flow[1].onerror).toBeDefined();
    });
  });

  describe("canHandle", () => {
    it("returns true for a valid DSL without policies", () => {
      expect(
        adapter.canHandle!({
          name: "Simple",
          trigger: { app: "webhook", event: "new" },
          steps: [{ id: "s1", app: "slack", action: "send_message" }],
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

    it("returns true for blueprints with conditions (Make supports them via Router)", () => {
      expect(
        adapter.canHandle!({
          trigger: { app: "app", event: "evt" },
          steps: [
            { id: "s1", app: "a", action: "b" },
            { id: "s2", app: "c", action: "d", condition: '{{steps.s1.ok}} === "yes"' },
          ],
        }),
      ).toBe(true);
    });

    it("returns true for blueprints with retry (Make supports it via onerror)", () => {
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
    it("inserts a Router module with filtered route for a conditional step", () => {
      const result: any = adapter.toTargetFormat({
        name: "Condition Test",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          { id: "kyc-check", app: "sumsub", action: "check", inputs: {} },
          {
            id: "create-contract",
            app: "pandadoc",
            action: "create",
            condition: '{{steps.kyc-check.status}} === "approved"',
            inputs: { template: "tpl" },
          },
          { id: "notify", app: "slack", action: "send", inputs: {} },
        ],
      });

      expect(result.flow[0].module).toBe("stripe:invoice.created");
      expect(result.flow[1].module).toBe("sumsub:check");

      const router = result.flow[2];
      expect(router.module).toBe("builtin:BasicRouter");
      expect(router.routes).toHaveLength(2);

      const route1 = router.routes[0].flow;
      expect(route1).toHaveLength(2);
      expect(route1[0].module).toBe("builtin:BasicFilter");

      const kycModuleId = result.flow[1].id;
      expect(route1[0].mapper.conditions).toEqual([
        [{ a: `{{${kycModuleId}.status}}`, o: "text:equal", b: "approved" }],
      ]);

      expect(route1[1].module).toBe("pandadoc:create");
      expect(route1[1].parameters).toEqual({ template: "tpl" });

      const route2 = router.routes[1].flow;
      expect(route2).toHaveLength(1);
      expect(route2[0].module).toBe("slack:send");
    });

    it("assigns unique module IDs across routes", () => {
      const result: any = adapter.toTargetFormat({
        name: "ID Test",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "x", inputs: {} },
          {
            id: "s2",
            app: "b",
            action: "y",
            condition: '{{steps.s1.ok}} === "yes"',
            inputs: {},
          },
          { id: "s3", app: "c", action: "z", inputs: {} },
        ],
      });

      const allIds: number[] = [];
      function collectIds(flow: any[]) {
        for (const mod of flow) {
          allIds.push(mod.id);
          if (mod.routes) {
            for (const route of mod.routes) {
              collectIds(route.flow);
            }
          }
        }
      }
      collectIds(result.flow);

      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it("maps condition operators to correct Make operator strings", () => {
      const cases: Array<{ condOp: string; value: string; makeOp: string }> = [
        { condOp: "===", value: '"v"', makeOp: "text:equal" },
        { condOp: "!==", value: '"v"', makeOp: "text:notequal" },
        { condOp: ">", value: "10", makeOp: "number:greater" },
        { condOp: ">=", value: "5", makeOp: "number:greaterequal" },
        { condOp: "<", value: "100", makeOp: "number:less" },
        { condOp: "<=", value: "50", makeOp: "number:lessequal" },
      ];

      cases.forEach(({ condOp, value, makeOp }) => {
        const result: any = adapter.toTargetFormat({
          name: "Op Test",
          trigger: { app: "app", event: "evt" },
          steps: [
            { id: "prev", app: "a", action: "x", inputs: {} },
            {
              id: "s1",
              app: "b",
              action: "y",
              condition: `{{steps.prev.f}} ${condOp} ${value}`,
              inputs: {},
            },
          ],
        });

        const router = result.flow[2];
        const filter = router.routes[0].flow[0];
        expect(filter.mapper.conditions[0][0].o).toBe(makeOp);
      });
    });

    it("treats unparseable conditions as unconditional steps", () => {
      const result: any = adapter.toTargetFormat({
        name: "Unparseable",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b", condition: "not-parseable", inputs: {} },
        ],
      });

      expect(result.flow).toHaveLength(2);
      expect(result.flow[1].module).toBe("a:b");
      expect(result.flow[1]).not.toHaveProperty("routes");
    });

    it("applies onerror to conditional step module inside the route", () => {
      const result: any = adapter.toTargetFormat({
        name: "Retry + Condition",
        trigger: { app: "app", event: "evt" },
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

      const router = result.flow[2];
      const condStep = router.routes[0].flow[1];
      expect(condStep.onerror).toEqual([{
        module: "builtin:Retry",
        mapper: { count: "3", retry: true, interval: "2000" },
      }]);
    });

    it("preserves metadata.expect on conditional step module", () => {
      const result: any = adapter.toTargetFormat({
        name: "Outputs + Condition",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "prev", app: "a", action: "x", inputs: {} },
          {
            id: "cond",
            app: "b",
            action: "y",
            condition: '{{steps.prev.ok}} === "yes"',
            inputs: {},
            outputs: ["result", "status"],
          },
        ],
      });

      const router = result.flow[2];
      const condStep = router.routes[0].flow[1];
      expect(condStep.metadata.expect).toEqual([
        { name: "result", type: "text", label: "result", required: false },
        { name: "status", type: "text", label: "status", required: false },
      ]);
    });

    it("does not insert Router when condition references unknown step ID", () => {
      const result: any = adapter.toTargetFormat({
        name: "Unknown Ref",
        trigger: { app: "app", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "a",
            action: "b",
            condition: '{{steps.nonexistent.f}} === "v"',
            inputs: {},
          },
        ],
      });

      expect(result.flow).toHaveLength(2);
      expect(result.flow[1].module).toBe("a:b");
      expect(result.flow[1]).not.toHaveProperty("routes");
    });
  });
});
