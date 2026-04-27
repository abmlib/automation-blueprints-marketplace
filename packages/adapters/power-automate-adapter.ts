import {
  Adapter, AdapterRegistry, BlueprintDsl, BlueprintDslFilter,
  PowerAutomateWorkflowOutput, PowerAutomateTrigger, PowerAutomateAction,
  PowerAutomateRetryPolicy, PowerAutomateTriggerCondition,
} from "./index";
import { parseCondition } from "./condition-parser";

const PA_EXPRESSION_BUILDERS: Record<string, (ref: string, val: string) => string> = {
  equals:                 (ref, val) => `@equals(${ref}, ${val})`,
  eq:                     (ref, val) => `@equals(${ref}, ${val})`,
  not_equals:             (ref, val) => `@not(equals(${ref}, ${val}))`,
  neq:                    (ref, val) => `@not(equals(${ref}, ${val}))`,
  contains:               (ref, val) => `@contains(${ref}, ${val})`,
  not_contains:           (ref, val) => `@not(contains(${ref}, ${val}))`,
  starts_with:            (ref, val) => `@startsWith(${ref}, ${val})`,
  ends_with:              (ref, val) => `@endsWith(${ref}, ${val})`,
  gt:                     (ref, val) => `@greater(${ref}, ${val})`,
  greater_than:           (ref, val) => `@greater(${ref}, ${val})`,
  gte:                    (ref, val) => `@greaterOrEquals(${ref}, ${val})`,
  greater_than_or_equal:  (ref, val) => `@greaterOrEquals(${ref}, ${val})`,
  lt:                     (ref, val) => `@less(${ref}, ${val})`,
  less_than:              (ref, val) => `@less(${ref}, ${val})`,
  lte:                    (ref, val) => `@lessOrEquals(${ref}, ${val})`,
  less_than_or_equal:     (ref, val) => `@lessOrEquals(${ref}, ${val})`,
};

function formatPaValue(value: unknown): string {
  if (typeof value === "string") return `'${value}'`;
  return String(value);
}

function buildTriggerConditions(
  filters: BlueprintDslFilter[],
): PowerAutomateTriggerCondition[] {
  return filters.map((f) => {
    const ref = `triggerOutputs()?['body/${f.field}']`;
    const val = formatPaValue(f.value);
    const builder = PA_EXPRESSION_BUILDERS[f.operator];
    const expression = builder
      ? builder(ref, val)
      : `@equals(${ref}, ${val})`;
    return { expression };
  });
}

/**
 * Adapter for converting blueprints to Microsoft Power Automate format.
 * 
 * Generates Azure Logic Apps workflow definition compliant with
 * Microsoft Power Automate schema, including triggers, actions,
 * and runAfter dependencies.
 * 
 * @internal
 */
class PowerAutomateAdapter implements Adapter<PowerAutomateWorkflowOutput> {
  runtime = "power-automate";

  detectUnsupportedFeatures(dsl: unknown): string[] {
    const d = dsl as Partial<BlueprintDsl>;
    const warnings: string[] = [];

    if (d.scopes && d.scopes.length > 0) {
      warnings.push("Blueprint 'scopes' are not supported by Power Automate and were omitted from the export.");
    }


    if (d.policies && Object.keys(d.policies).length > 0) {
      warnings.push("Blueprint 'policies' are not supported by Power Automate and were omitted from the export.");
    }

    return warnings;
  }

  /**
   * Converts automation blueprint DSL to Power Automate workflow format.
   * 
   * Creates a workflow definition following the Azure Logic Apps schema,
   * with mapped triggers, actions, and dependency chains.
   * 
   * @param dsl - Blueprint object in DSL format
   * @returns Power Automate workflow definition JSON
   */
  canHandle(dsl: unknown): boolean {
    const d = dsl as Partial<BlueprintDsl>;
    if (d.policies && Object.keys(d.policies).length > 0) {
      return false;
    }
    return true;
  }

  toTargetFormat(dsl: BlueprintDsl): PowerAutomateWorkflowOutput {
    const trigger = dsl.trigger;
    const steps = dsl.steps;

    const triggerName = trigger.event;
    const filters = trigger.filters ?? [];
    const triggerDef: PowerAutomateTrigger = {
      type: this.mapTriggerType(trigger.app),
      kind: "Http",
      inputs: { schema: {}, method: "POST" },
    };
    if (filters.length > 0) {
      triggerDef.conditions = buildTriggerConditions(filters);
    }
    const triggers: Record<string, PowerAutomateTrigger> = {
      [triggerName]: triggerDef,
    };

    const retry = dsl.retry;
    const retryPolicy: PowerAutomateRetryPolicy | undefined = retry
      ? {
          type: "fixed",
          count: retry.attempts,
          interval: `PT${Math.ceil(retry.delayMs / 1000)}S`,
        }
      : undefined;

    const actions: Record<string, PowerAutomateAction> = {};
    let previous: string | null = null;

    steps.forEach((step) => {
      const name = step.id;
      const baseAction: PowerAutomateAction = {
        type: this.mapActionType(step.app, step.action),
        inputs: step.inputs ?? {},
        runAfter: {},
      };
      if (retryPolicy) {
        baseAction.retryPolicy = retryPolicy;
      }

      const parsed = step.condition ? parseCondition(step.condition) : null;

      if (parsed) {
        const ref = `actions('${parsed.stepId}').outputs.body.${parsed.field}`;
        const val = formatPaValue(parsed.value);
        const builder = PA_EXPRESSION_BUILDERS[parsed.operator];
        const expression = builder
          ? builder(ref, val)
          : PA_EXPRESSION_BUILDERS.equals(ref, val);

        const innerActions: Record<string, PowerAutomateAction> = {
          [name]: baseAction,
        };

        if (step.transforms) {
          step.transforms.forEach((t, tIdx) => {
            const tName = `${name}_Transform_${tIdx}`;
            innerActions[tName] = {
              type: "Compose",
              inputs: `@{${t.operation}(body('${name}')?['${t.field}'])}`,
              runAfter: { [name]: ["Succeeded"] },
            };
          });
        }

        const ifName = `Condition_${name}`;
        actions[ifName] = {
          type: "If",
          expression,
          actions: innerActions,
          else: { actions: {} },
          runAfter: previous ? { [previous]: ["Succeeded"] } : {},
        };
        previous = ifName;
      } else {
        baseAction.runAfter = previous ? { [previous]: ["Succeeded"] } : {};
        actions[name] = baseAction;

        if (step.transforms) {
          step.transforms.forEach((t, tIdx) => {
            const tName = `${name}_Transform_${tIdx}`;
            actions[tName] = {
              type: "Compose",
              inputs: `@{${t.operation}(body('${name}')?['${t.field}'])}`,
              runAfter: { [name]: ["Succeeded"] },
            };
          });
        }

        previous = name;
      }
    });

    const workflowOutputs: Record<string, unknown> = {};
    steps.forEach((step) => {
      if (Array.isArray(step.outputs) && step.outputs.length > 0) {
        step.outputs.forEach((output) => {
          workflowOutputs[`${step.id}_${output}`] = {
            type: "string",
            value: `@actions('${step.id}').outputs.body.${output}`,
          };
        });
      }
    });

    return {
      $schema:
        "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
      contentVersion: "1.0.0.0",
      parameters: {},
      triggers,
      actions,
      outputs: workflowOutputs,
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
