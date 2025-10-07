import { Adapter, AdapterRegistry } from "./index";

/**
 * Adapter for converting blueprints to Microsoft Power Automate format.
 * 
 * Generates Azure Logic Apps workflow definition compliant with
 * Microsoft Power Automate schema, including triggers, actions,
 * and runAfter dependencies.
 * 
 * @internal
 */
class PowerAutomateAdapter implements Adapter {
  runtime = "power-automate";

  /**
   * Converts automation blueprint DSL to Power Automate workflow format.
   * 
   * Creates a workflow definition following the Azure Logic Apps schema,
   * with mapped triggers, actions, and dependency chains.
   * 
   * @param dsl - Blueprint object in DSL format
   * @returns Power Automate workflow definition JSON
   */
  toTargetFormat(dsl: any) {
    const trigger = dsl.trigger ?? {};
    const steps = dsl.steps ?? [];

    const triggerName = trigger.event ?? "manual";
    const triggers: any = {
      [triggerName]: {
        type: this.mapTriggerType(trigger.app),
        kind: "Http",
        inputs: { schema: {}, method: "POST" },
      },
    };

    const actions: any = {};
    let previous: string | null = null;

    steps.forEach((step: any, idx: number) => {
      const name = step.id ?? `Action_${idx}`;
      actions[name] = {
        type: this.mapActionType(step.app, step.action),
        inputs: step.inputs ?? {},
        runAfter: previous ? { [previous]: ["Succeeded"] } : {},
      };

      if (step.transforms) {
        step.transforms.forEach((t: any, tIdx: number) => {
          const tName = `${name}_Transform_${tIdx}`;
          actions[tName] = {
            type: "Compose",
            inputs: `@{${t.operation}(body('${name}')?['${t.field}'])}`,
            runAfter: { [name]: ["Succeeded"] },
          };
        });
      }

      previous = name;
    });

    return {
      $schema:
        "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
      contentVersion: "1.0.0.0",
      parameters: {},
      triggers,
      actions,
      outputs: {},
    };
  }

  /**
   * Maps blueprint trigger app to Power Automate trigger type.
   * 
   * @param app - Trigger app identifier from blueprint
   * @returns Power Automate trigger type
   * @private
   */
  private mapTriggerType(app?: string): string {
    const map: Record<string, string> = {
      http: "Request",
      webhook: "HttpWebhook",
      recurrence: "Recurrence",
    };
    return map[app ?? "http"] ?? "Request";
  }

  /**
   * Maps blueprint action to Power Automate action type.
   * 
   * @param app - Action app identifier from blueprint
   * @param action - Action name from blueprint
   * @returns Power Automate action type
   * @private
   */
  private mapActionType(app?: string, action?: string): string {
    if (app === "http") return "Http";
    if (action === "compose") return "Compose";
    return "ApiConnection";
  }
}

AdapterRegistry.register(new PowerAutomateAdapter());
