import { Adapter, AdapterRegistry } from "./index";

/**
 * Adapter for converting blueprints to n8n workflow format.
 * 
 * Generates n8n-compatible workflow JSON with nodes, connections,
 * and expression-based field mappings for the n8n automation platform.
 * 
 * @internal
 */
class N8nAdapter implements Adapter {
  runtime = "n8n";

  /**
   * Converts automation blueprint DSL to n8n workflow format.
   * 
   * Creates a workflow with webhook trigger node and action nodes,
   * including node connections and expression-based transforms.
   * 
   * @param dsl - Blueprint object in DSL format
   * @returns n8n workflow JSON with nodes and connections
   */
  toTargetFormat(dsl: any) {
    const trigger = dsl.trigger ?? {};
    const steps = dsl.steps ?? [];

    const nodes: any[] = [
      {
        parameters: {
          path: `/${trigger.event ?? "webhook"}`,
          responseMode: "onReceived",
          options: {},
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 300],
        webhookId: trigger.event ?? "default",
      },
    ];

    const connections: any = {
      Webhook: {
        main: [steps.length > 0 ? [{ node: steps[0].id ?? "Step_0", type: "main", index: 0 }] : []],
      },
    };

    steps.forEach((step: any, index: number) => {
      const nodeName = step.id ?? `Step_${index}`;

      const parameters: any = { ...(step.inputs ?? {}) };
      if (step.transforms && Array.isArray(step.transforms)) {
        step.transforms.forEach((t: any) => {
          if (t.field && t.operation) {
            parameters[t.field] = `={{ $json[\"${t.field}\"].${t.operation}() }}`;
          }
        });
      }

      nodes.push({
        parameters,
        name: nodeName,
        type: `n8n-nodes-base.${step.app ?? "set"}`,
        typeVersion: 1,
        position: [250 + (index + 1) * 200, 300],
      });

      if (index < steps.length - 1) {
        connections[nodeName] = {
          main: [[{ node: steps[index + 1].id ?? `Step_${index + 1}`, type: "main", index: 0 }]],
        };
      }
    });

    return {
      name: dsl.name ?? "automation-blueprint",
      nodes,
      connections,
      active: false,
      settings: {},
      tags: [],
    };
  }
}

AdapterRegistry.register(new N8nAdapter());
