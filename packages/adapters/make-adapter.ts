import { Adapter, AdapterRegistry } from "./index";

/**
 * Adapter for converting blueprints to Make (Integromat) scenario format.
 * 
 * Generates Make-compatible scenario JSON with flow definitions,
 * module connections, and visual positioning for the Make platform.
 * 
 * @internal
 */
class MakeAdapter implements Adapter {
  runtime = "make";

  /**
   * Converts automation blueprint DSL to Make (Integromat) scenario format.
   * 
   * Creates a flow array with trigger and action modules, including
   * positioning metadata and parameter mappings.
   * 
   * @param dsl - Blueprint object in DSL format
   * @returns Make scenario JSON with flow array and metadata
   */
  toTargetFormat(dsl: any) {
    const trigger = dsl.trigger ?? {};
    const steps = dsl.steps ?? [];

    const flow: any[] = [
      {
        id: 1,
        module: `${trigger.app ?? "webhook"}:${trigger.event ?? "trigger"}`,
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 0, y: 0 },
          restore: {},
          expect: [
            {
              name: "event",
              type: "text",
              label: "Event Type",
              required: false,
            },
          ],
        },
      },
    ];

    steps.forEach((step: any, index: number) => {
      flow.push({
        id: index + 2,
        module: `${step.app ?? "tools"}:${step.action ?? "set-variable"}`,
        version: 1,
        parameters: step.inputs ?? {},
        mapper: step.transforms ?? {},
        metadata: {
          designer: { x: 0, y: (index + 1) * 150 },
          restore: {},
        },
      });
    });

    return {
      name: dsl.name ?? "automation-blueprint",
      flow,
      metadata: {
        version: 1,
        scenario: { roundtrips: 1, maxErrors: 3 },
      },
    };
  }
}

AdapterRegistry.register(new MakeAdapter());
