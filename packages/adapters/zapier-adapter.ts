import { Adapter, AdapterRegistry } from "./index";

/**
 * Adapter for converting blueprints to Zapier platform format.
 * 
 * Generates Zapier-compatible JSON including trigger definitions,
 * searches, and creates for use with the Zapier Developer Platform.
 * 
 * @internal
 */
class ZapierAdapter implements Adapter {
  runtime = "zapier";

  /**
   * Converts blueprint DSL to Zapier platform format.
   * 
   * @param dsl - Blueprint object in DSL format
   * @returns Zapier platform JSON with triggers, searches, and creates
   */
  toTargetFormat(dsl: any) {
    const trigger = dsl.trigger ?? {};
    return {
      name: dsl.name ?? "automation-blueprint",
      version: dsl.version ?? "0.1.0",
      triggers: {
        [trigger.event ?? "trigger"]: {
          operation: {
            perform: {
              url: `https://example.com/trigger/${trigger.event}`,
              method: "POST",
            },
          },
        },
      },
      searches: {},
      creates: {},
    };
  }

  /**
   * Checks if this adapter can handle the given blueprint.
   * 
   * @returns Always true (Zapier adapter supports all blueprints)
   */
  canHandle() {
    return true;
  }
}

AdapterRegistry.register(new ZapierAdapter());
