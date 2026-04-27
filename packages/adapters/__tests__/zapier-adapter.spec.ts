import { AdapterRegistry, ZapierPlatformOutput } from "../index";

describe("ZapierAdapter", () => {
  const adapter = AdapterRegistry.get("zapier")!;

  it("is registered with runtime 'zapier'", () => {
    expect(adapter).toBeDefined();
    expect(adapter.runtime).toBe("zapier");
  });

  describe("toTargetFormat", () => {
    it("maps DSL steps to creates entries", () => {
      const result = adapter.toTargetFormat({
        name: "Test BP",
        version: "1.0.0",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          {
            id: "send-msg",
            app: "slack",
            action: "send_message",
            inputs: { channel: "#general", text: "Hello" },
          },
        ],
      }) as ZapierPlatformOutput;

      expect(Object.keys(result.creates)).toEqual(["send-msg"]);
      expect(result.searches).toEqual({});

      const create = result.creates["send-msg"];
      expect(create.key).toBe("send-msg");
      expect(create.noun).toBe("slack");
      expect(create.display.label).toBe("slack — send_message");
      expect(create.operation.perform.method).toBe("POST");
      expect(create.operation.perform.body).toEqual({
        channel: "#general",
        text: "Hello",
      });
    });

    it("classifies search-type actions into searches", () => {
      const result = adapter.toTargetFormat({
        name: "Search BP",
        version: "1.0.0",
        trigger: { app: "hubspot", event: "contact.created" },
        steps: [
          { id: "find-contact", app: "hubspot", action: "find_contact", inputs: { email: "a@b.com" } },
          { id: "search-deals", app: "hubspot", action: "search_deals", inputs: { query: "test" } },
          { id: "get-company", app: "hubspot", action: "get_company", inputs: { id: "123" } },
          { id: "lookup-user", app: "crm", action: "lookup_user", inputs: { name: "John" } },
          { id: "list-items", app: "inventory", action: "list_items", inputs: {} },
          { id: "fetch-data", app: "api", action: "fetch_data", inputs: {} },
          { id: "retrieve-doc", app: "docs", action: "retrieve_document", inputs: {} },
          { id: "query-db", app: "db", action: "query_records", inputs: {} },
          { id: "read-file", app: "storage", action: "read_file", inputs: {} },
        ],
      }) as ZapierPlatformOutput;

      expect(Object.keys(result.searches)).toHaveLength(9);
      expect(Object.keys(result.creates)).toHaveLength(0);

      for (const key of Object.keys(result.searches)) {
        expect(result.searches[key].operation.perform.method).toBe("GET");
        expect(result.searches[key].operation.perform).toHaveProperty("params");
        expect(result.searches[key].operation.perform).not.toHaveProperty("body");
      }
    });

    it("correctly separates a mix of searches and creates", () => {
      const result = adapter.toTargetFormat({
        name: "Mixed",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "crm", action: "find_contact", inputs: {} },
          { id: "s2", app: "slack", action: "send_message", inputs: {} },
          { id: "s3", app: "db", action: "query_records", inputs: {} },
          { id: "s4", app: "email", action: "send_email", inputs: {} },
        ],
      }) as ZapierPlatformOutput;

      expect(Object.keys(result.searches)).toEqual(["s1", "s3"]);
      expect(Object.keys(result.creates)).toEqual(["s2", "s4"]);
    });

    it("uses configurable bundle.authData.baseUrl for trigger URL", () => {
      const result: any = adapter.toTargetFormat({
        name: "URL Test",
        version: "1.0.0",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [],
      });

      const triggerUrl =
        result.triggers["invoice.created"].operation.perform.url;
      expect(triggerUrl).toBe(
        "{{bundle.authData.baseUrl}}/stripe/invoice.created",
      );
      expect(triggerUrl).not.toContain("example.com");
    });

    it("uses configurable bundle.authData.baseUrl for step URLs", () => {
      const result: any = adapter.toTargetFormat({
        name: "Step URL",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: {} },
        ],
      });

      const stepUrl = result.creates["s1"].operation.perform.url;
      expect(stepUrl).toBe("{{bundle.authData.baseUrl}}/slack/send_message");
      expect(stepUrl).not.toContain("example.com");
    });

    it("maps trigger.filters to trigger operation inputFields", () => {
      const result: any = adapter.toTargetFormat({
        name: "Filtered",
        version: "1.0.0",
        trigger: {
          app: "hubspot",
          event: "contact.created",
          filters: [
            { field: "lifecycle_stage", operator: "equals", value: "lead" },
            { field: "score", operator: "gte", value: 50 },
          ],
        },
        steps: [],
      });

      const inputFields =
        result.triggers["contact.created"].operation.inputFields;
      expect(inputFields).toHaveLength(2);

      expect(inputFields[0]).toEqual({
        key: "lifecycle_stage",
        type: "string",
        label: "lifecycle_stage",
        helpText: "Filter: lifecycle_stage equals lead",
        default: "lead",
      });

      expect(inputFields[1]).toEqual({
        key: "score",
        type: "string",
        label: "score",
        helpText: "Filter: score gte 50",
        default: "50",
      });
    });

    it("maps step.transforms to outputFields", () => {
      const result: any = adapter.toTargetFormat({
        name: "Transform BP",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "formatter",
            action: "format",
            inputs: {},
            transforms: [
              { field: "name", operation: "uppercase" },
              { field: "email", operation: "lowercase" },
            ],
          },
        ],
      });

      const outputFields = result.creates["s1"].operation.outputFields;
      expect(outputFields).toEqual([
        { key: "name", type: "string", label: "name (uppercase)" },
        { key: "email", type: "string", label: "email (lowercase)" },
      ]);
    });

    it("maps step.outputs to outputFields", () => {
      const result: any = adapter.toTargetFormat({
        name: "Outputs BP",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "formatter",
            action: "text_format",
            inputs: {},
            outputs: ["formatted_text", "char_count"],
          },
        ],
      });

      const outputFields = result.creates["s1"].operation.outputFields;
      expect(outputFields).toEqual([
        { key: "formatted_text", type: "string" },
        { key: "char_count", type: "string" },
      ]);
    });

    it("merges step.outputs and step.transforms into outputFields without duplicates", () => {
      const result: any = adapter.toTargetFormat({
        name: "Merged",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "tool",
            action: "process",
            inputs: {},
            outputs: ["name", "email"],
            transforms: [{ field: "name", operation: "uppercase" }],
          },
        ],
      });

      const outputFields = result.creates["s1"].operation.outputFields;
      expect(outputFields).toHaveLength(2);
      expect(outputFields).toEqual([
        { key: "name", type: "string", label: "name (uppercase)" },
        { key: "email", type: "string" },
      ]);
    });

    it("omits outputFields when step has no outputs or transforms", () => {
      const result: any = adapter.toTargetFormat({
        name: "No outputs",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "slack", action: "send_message", inputs: {} },
        ],
      });

      expect(result.creates["s1"].operation).not.toHaveProperty(
        "outputFields",
      );
    });

    it("infers Zapier field types from input value types", () => {
      const result: any = adapter.toTargetFormat({
        name: "Types",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [
          {
            id: "s1",
            app: "tool",
            action: "do_thing",
            inputs: {
              label: "hello",
              count: 42,
              rate: 3.14,
              enabled: true,
              config: { nested: true },
            },
          },
        ],
      });

      const fields = result.creates["s1"].operation.inputFields;
      const typeByKey = Object.fromEntries(
        fields.map((f: any) => [f.key, f.type]),
      );

      expect(typeByKey.label).toBe("string");
      expect(typeByKey.count).toBe("integer");
      expect(typeByKey.rate).toBe("number");
      expect(typeByKey.enabled).toBe("boolean");
      expect(typeByKey.config).toBe("text");
    });

    it("passes through name and version from DSL", () => {
      const result: any = adapter.toTargetFormat({
        name: "My Blueprint",
        version: "2.5.0",
        trigger: { app: "app", event: "evt" },
        steps: [],
      });

      expect(result.name).toBe("My Blueprint");
      expect(result.version).toBe("2.5.0");
    });

    it("handles steps with no inputs gracefully", () => {
      const result: any = adapter.toTargetFormat({
        name: "Empty inputs",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "noop" }],
      });

      const create = result.creates["s1"];
      expect(create.operation.inputFields).toEqual([]);
      expect(create.operation.perform.body).toEqual({});
    });

    it("produces trigger with display metadata", () => {
      const result: any = adapter.toTargetFormat({
        name: "Trigger Meta",
        version: "1.0.0",
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [],
      });

      const trigger = result.triggers["invoice.created"];
      expect(trigger.key).toBe("invoice.created");
      expect(trigger.noun).toBe("stripe");
      expect(trigger.display.label).toBe("stripe — invoice.created");
      expect(trigger.display.description).toContain("invoice.created");
    });

    it("maps scopes to authentication.oauth2Config.scope", () => {
      const result = adapter.toTargetFormat({
        name: "Scoped BP",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [],
        scopes: ["read", "write"],
      }) as ZapierPlatformOutput;

      expect(result.authentication).toEqual({
        oauth2Config: { scope: "read write" },
      });
    });

    it("omits authentication when scopes are absent", () => {
      const result = adapter.toTargetFormat({
        name: "No scopes",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [],
      }) as ZapierPlatformOutput;

      expect(result.authentication).toBeUndefined();
    });

    it("omits authentication when scopes is an empty array", () => {
      const result = adapter.toTargetFormat({
        name: "Empty scopes",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [],
        scopes: [],
      }) as ZapierPlatformOutput;

      expect(result.authentication).toBeUndefined();
    });

    it("produces empty trigger inputFields when no filters exist", () => {
      const result: any = adapter.toTargetFormat({
        name: "No filters",
        version: "1.0.0",
        trigger: { app: "app", event: "evt" },
        steps: [],
      });

      expect(result.triggers["evt"].operation.inputFields).toEqual([]);
    });

    it("converts the canonical invoice-notification blueprint correctly", () => {
      const invoiceDsl = {
        id: "invoice-notification",
        name: "Invoice Created → Slack Notification",
        version: "1.2.0",
        apps: ["stripe", "slack"],
        trigger: { app: "stripe", event: "invoice.created" },
        steps: [
          {
            id: "format-message",
            app: "formatter",
            action: "text_format",
            inputs: {
              template:
                "New invoice #{{trigger.invoice.number}} for ${{trigger.invoice.amount_due}} created for {{trigger.customer.name}}",
            },
            outputs: ["formatted_text"],
          },
          {
            id: "send-notification",
            app: "slack",
            action: "send_message",
            inputs: {
              channel: "#billing",
              text: "{{steps.format-message.formatted_text}}",
              attachments: [
                {
                  color: "good",
                  fields: [
                    {
                      title: "Customer",
                      value: "{{trigger.customer.name}}",
                      short: true,
                    },
                    {
                      title: "Amount",
                      value: "${{trigger.invoice.amount_due}}",
                      short: true,
                    },
                  ],
                },
              ],
            },
          },
        ],
      };

      const result: any = adapter.toTargetFormat(invoiceDsl);

      expect(result.name).toBe("Invoice Created → Slack Notification");
      expect(result.version).toBe("1.2.0");
      expect(Object.keys(result.triggers)).toEqual(["invoice.created"]);
      expect(Object.keys(result.creates)).toEqual([
        "format-message",
        "send-notification",
      ]);
      expect(result.searches).toEqual({});

      expect(
        result.creates["format-message"].operation.outputFields,
      ).toEqual([{ key: "formatted_text", type: "string" }]);

      expect(
        result.creates["send-notification"].operation.perform.body,
      ).toEqual(invoiceDsl.steps[1].inputs);
    });
  });

  describe("detectUnsupportedFeatures", () => {
    it("returns empty array when DSL has no unsupported features", () => {
      expect(
        adapter.detectUnsupportedFeatures!({
          name: "Simple",
          version: "1.0.0",
          trigger: { app: "stripe", event: "invoice.created" },
          steps: [{ id: "s1", app: "slack", action: "send_message" }],
        }),
      ).toEqual([]);
    });

    it("does not warn about scopes (Zapier maps them to authentication.oauth2Config.scope)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["read", "write"],
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("does not warn about empty scopes", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: [],
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("warns about retry with clarified Zapier-specific text", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        retry: { attempts: 3, delayMs: 1000 },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("not natively supported in the Zapier platform schema");
    });

    it("warns about policies when present with entries", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        policies: { rateLimit: { maxPerMinute: 10 } },
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("policies");
      expect(warnings[0]).toContain("Zapier");
    });

    it("does not warn about empty policies object", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        policies: {},
        trigger: { app: "app", event: "evt" },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("warns about step-level condition and lists affected step IDs", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "app", event: "evt" },
        steps: [
          { id: "s1", app: "a", action: "b" },
          { id: "s2", app: "c", action: "d", condition: '{{steps.s1.status}} === "ok"' },
          { id: "s3", app: "e", action: "f", condition: "true" },
        ],
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("condition");
      expect(warnings[0]).toContain("s2");
      expect(warnings[0]).toContain("s3");
      expect(warnings[0]).not.toContain("s1");
    });

    it("does not warn about filters (Zapier supports them)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: {
          app: "hubspot",
          event: "contact.created",
          filters: [{ field: "stage", operator: "equals", value: "lead" }],
        },
        steps: [],
      });
      expect(warnings).toEqual([]);
    });

    it("does not warn about outputs (Zapier supports them)", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "tool", action: "do", outputs: ["result"] }],
      });
      expect(warnings).toEqual([]);
    });

    it("accumulates multiple warnings for multiple unsupported features", () => {
      const warnings = adapter.detectUnsupportedFeatures!({
        scopes: ["admin"],
        retry: { attempts: 2, delayMs: 500 },
        policies: { logging: true },
        trigger: { app: "app", event: "evt" },
        steps: [{ id: "s1", app: "a", action: "b", condition: "true" }],
      });
      expect(warnings).toHaveLength(3);
    });
  });

  describe("canHandle", () => {
    it("returns true for a valid DSL without policies or conditions", () => {
      expect(
        adapter.canHandle!({
          name: "Simple",
          steps: [{ id: "s1", app: "slack", action: "send_message" }],
        }),
      ).toBe(true);
    });

    it("returns true when policies is an empty object", () => {
      expect(
        adapter.canHandle!({
          policies: {},
          steps: [],
        }),
      ).toBe(true);
    });

    it("returns false when policies has entries", () => {
      expect(
        adapter.canHandle!({
          policies: { rateLimit: { maxPerMinute: 10 } },
          steps: [],
        }),
      ).toBe(false);
    });

    it("returns false when any step has a condition", () => {
      expect(
        adapter.canHandle!({
          steps: [
            { id: "s1", app: "a", action: "b" },
            {
              id: "s2",
              app: "c",
              action: "d",
              condition: '{{steps.s1.status}} === "approved"',
            },
          ],
        }),
      ).toBe(false);
    });

    it("returns true when steps are absent", () => {
      expect(adapter.canHandle!({})).toBe(true);
    });
  });
});
