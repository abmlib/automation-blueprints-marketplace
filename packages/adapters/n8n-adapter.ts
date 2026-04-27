import {
  Adapter, AdapterRegistry, BlueprintDsl, BlueprintDslFilter,
  N8nWorkflowOutput, N8nNode, N8nNodeConnection, N8nConnectionEntry,
} from "./index";
import { parseCondition, ParsedCondition } from "./condition-parser";

const WEBHOOK_APPS = new Set(["webhook", "http"]);
const SCHEDULE_APPS = new Set(["schedule", "cron"]);

/**
 * Maps a DSL `trigger.app` value to the corresponding n8n trigger node type.
 *
 * Webhook/HTTP apps resolve to the core webhook node; schedule/cron apps
 * resolve to the scheduleTrigger core node; all other apps follow the
 * n8n convention `n8n-nodes-base.<app>Trigger`.
 */
function mapTriggerNodeType(app: string): string {
  if (WEBHOOK_APPS.has(app)) return "n8n-nodes-base.webhook";
  if (SCHEDULE_APPS.has(app)) return "n8n-nodes-base.scheduleTrigger";
  return `n8n-nodes-base.${app}Trigger`;
}

/**
 * Derives a human-readable n8n node name from the DSL trigger app.
 */
function mapTriggerNodeName(app: string): string {
  if (WEBHOOK_APPS.has(app)) return "Webhook";
  if (SCHEDULE_APPS.has(app)) return "Schedule Trigger";
  return `${app.charAt(0).toUpperCase()}${app.slice(1)} Trigger`;
}

/**
 * Builds the `parameters` object for the trigger node based on its type.
 *
 * - Webhook nodes receive `path`, `responseMode`, and `options`.
 * - Schedule nodes receive a `rule.interval` entry keyed by the event name.
 * - App-specific triggers receive an `event` parameter and, when present,
 *   DSL filters mapped into n8n-style filter conditions.
 */
function buildTriggerParameters(
  app: string,
  event: string,
  filters?: BlueprintDslFilter[],
): Record<string, unknown> {
  if (WEBHOOK_APPS.has(app)) {
    return {
      path: `/${event}`,
      responseMode: "onReceived",
      options: {},
    };
  }

  if (SCHEDULE_APPS.has(app)) {
    return {
      rule: { interval: [{ field: event }] },
    };
  }

  const params: Record<string, unknown> = { event };
  if (Array.isArray(filters) && filters.length > 0) {
    params.filters = {
      conditions: filters.map((f) => ({
        field: f.field,
        operation: f.operator,
        value: f.value,
      })),
    };
  }
  return params;
}

const N8N_STRING_OP_MAP: Record<string, string> = {
  equals: "equal",
  eq: "equal",
  not_equals: "notEqual",
  neq: "notEqual",
  contains: "contains",
  not_contains: "notContains",
  starts_with: "startsWith",
  ends_with: "endsWith",
};

const N8N_NUMBER_OP_MAP: Record<string, string> = {
  equals: "equal",
  eq: "equal",
  not_equals: "notEqual",
  neq: "notEqual",
  gt: "larger",
  greater_than: "larger",
  gte: "largerEqual",
  greater_than_or_equal: "largerEqual",
  lt: "smaller",
  less_than: "smaller",
  lte: "smallerEqual",
  less_than_or_equal: "smallerEqual",
};

/**
 * Builds the `parameters` object for an n8n IF node from a parsed condition.
 *
 * The condition type (string, number, boolean) is inferred from the parsed
 * value, and the DSL operator is mapped to the corresponding n8n operation.
 */
function buildIfNodeParameters(
  parsed: ParsedCondition,
): Record<string, unknown> {
  const valueType = typeof parsed.value;
  let conditionType: string;
  let operation: string;

  if (valueType === "number") {
    conditionType = "number";
    operation = N8N_NUMBER_OP_MAP[parsed.operator] ?? "equal";
  } else if (valueType === "boolean") {
    conditionType = "boolean";
    operation = parsed.operator === "not_equals" || parsed.operator === "neq"
      ? "notEqual"
      : "equal";
  } else {
    conditionType = "string";
    operation = N8N_STRING_OP_MAP[parsed.operator] ?? "equal";
  }

  return {
    conditions: {
      [conditionType]: [
        {
          value1: `={{ $node['${parsed.stepId}'].json.${parsed.field} }}`,
          operation,
          value2: parsed.value,
        },
      ],
    },
  };
}

/**
 * Adapter for converting blueprints to n8n workflow format.
 *
 * Generates n8n-compatible workflow JSON with nodes, connections,
 * and expression-based field mappings for the n8n automation platform.
 *
 * Trigger mapping follows official n8n node-type conventions:
 * - `webhook` / `http`     → `n8n-nodes-base.webhook`
 * - `schedule` / `cron`    → `n8n-nodes-base.scheduleTrigger`
 * - Any other app `<app>`  → `n8n-nodes-base.<app>Trigger`
 *
 * @internal
 */
class N8nAdapter implements Adapter<N8nWorkflowOutput> {
  runtime = "n8n";

  detectUnsupportedFeatures(dsl: unknown): string[] {
    const d = dsl as Partial<BlueprintDsl>;
    const warnings: string[] = [];

    if (d.scopes && d.scopes.length > 0) {
      warnings.push("Blueprint 'scopes' are not supported by n8n and were omitted from the export.");
    }
    if (d.retry) {
      const clamped: string[] = [];
      if (d.retry.attempts > 5) clamped.push("attempts was clamped to 5");
      if (d.retry.delayMs > 5000) clamped.push("delayMs was clamped to 5000ms");
      if (clamped.length > 0) {
        warnings.push(
          `Blueprint 'retry' configuration exceeds n8n limits: ${clamped.join("; ")}. Values were clamped in the export.`,
        );
      }
    }
    if (d.policies && Object.keys(d.policies).length > 0) {
      warnings.push("Blueprint 'policies' are not supported by n8n and were omitted from the export.");
    }

    const trigger = d.trigger;
    if (
      trigger &&
      Array.isArray(trigger.filters) &&
      trigger.filters.length > 0 &&
      (WEBHOOK_APPS.has(trigger.app) || SCHEDULE_APPS.has(trigger.app))
    ) {
      warnings.push(
        `Trigger 'filters' are not supported for ${trigger.app} triggers in n8n and were omitted from the export.`,
      );
    }

    const steps = d.steps ?? [];

    const outputSteps = steps.filter((s) => s.outputs && s.outputs.length > 0).map((s) => s.id);
    if (outputSteps.length > 0) {
      warnings.push(
        `Step-level 'outputs' on [${outputSteps.join(", ")}] are not supported by n8n and were omitted from the export.`,
      );
    }

    return warnings;
  }

  /**
   * Converts automation blueprint DSL to n8n workflow format.
   *
   * Creates a workflow with the appropriate trigger node type derived
   * from `trigger.app`, action nodes for each step, node connections,
   * and expression-based transforms.
   *
   * @param dsl - Blueprint object in DSL format
   * @returns n8n workflow JSON with nodes and connections
   */
  canHandle(dsl: unknown): boolean {
    const d = dsl as Partial<BlueprintDsl>;
    if (d.policies && Object.keys(d.policies).length > 0) {
      return false;
    }
    return true;
  }

  toTargetFormat(dsl: BlueprintDsl): N8nWorkflowOutput {
    const trigger = dsl.trigger;
    const steps = dsl.steps;

    const triggerType = mapTriggerNodeType(trigger.app);
    const triggerName = mapTriggerNodeName(trigger.app);
    const triggerParams = buildTriggerParameters(trigger.app, trigger.event, trigger.filters);

    const triggerNode: N8nNode = {
      parameters: triggerParams,
      name: triggerName,
      type: triggerType,
      typeVersion: 1,
      position: [250, 300],
    };

    if (WEBHOOK_APPS.has(trigger.app)) {
      triggerNode.webhookId = trigger.event;
    }

    const nodes: N8nNode[] = [triggerNode];
    const connections: Record<string, N8nNodeConnection> = {};
    const retry = dsl.retry;

    interface StepNodeInfo {
      entryName: string;
      stepName: string;
      isConditional: boolean;
      ifNodeName?: string;
    }

    const stepInfos: StepNodeInfo[] = [];
    let positionIndex = 1;

    steps.forEach((step) => {
      const nodeName = step.id;
      const parsed = step.condition ? parseCondition(step.condition) : null;

      if (parsed) {
        const ifNodeName = `IF_${nodeName}`;
        const ifNode: N8nNode = {
          parameters: buildIfNodeParameters(parsed),
          name: ifNodeName,
          type: "n8n-nodes-base.if",
          typeVersion: 1,
          position: [250 + positionIndex * 200, 300],
        };
        nodes.push(ifNode);
        positionIndex++;

        const parameters: Record<string, unknown> = { ...(step.inputs ?? {}) };
        if (step.transforms && Array.isArray(step.transforms)) {
          step.transforms.forEach((t) => {
            if (t.field && t.operation) {
              parameters[t.field] = `={{ $json["${t.field}"].${t.operation}() }}`;
            }
          });
        }

        const node: N8nNode = {
          parameters,
          name: nodeName,
          type: `n8n-nodes-base.${step.app}`,
          typeVersion: 1,
          position: [250 + positionIndex * 200, 300],
        };
        if (retry) {
          node.retryOnFail = true;
          node.maxTries = Math.min(retry.attempts, 5);
          node.waitBetweenTries = Math.min(retry.delayMs, 5000);
        }
        nodes.push(node);
        positionIndex++;

        stepInfos.push({
          entryName: ifNodeName,
          stepName: nodeName,
          isConditional: true,
          ifNodeName,
        });
      } else {
        const parameters: Record<string, unknown> = { ...(step.inputs ?? {}) };
        if (step.transforms && Array.isArray(step.transforms)) {
          step.transforms.forEach((t) => {
            if (t.field && t.operation) {
              parameters[t.field] = `={{ $json["${t.field}"].${t.operation}() }}`;
            }
          });
        }

        const node: N8nNode = {
          parameters,
          name: nodeName,
          type: `n8n-nodes-base.${step.app}`,
          typeVersion: 1,
          position: [250 + positionIndex * 200, 300],
        };
        if (retry) {
          node.retryOnFail = true;
          node.maxTries = Math.min(retry.attempts, 5);
          node.waitBetweenTries = Math.min(retry.delayMs, 5000);
        }
        nodes.push(node);
        positionIndex++;

        stepInfos.push({
          entryName: nodeName,
          stepName: nodeName,
          isConditional: false,
        });
      }
    });

    if (stepInfos.length > 0) {
      connections[triggerName] = {
        main: [[{ node: stepInfos[0].entryName, type: "main", index: 0 }]],
      };
    } else {
      connections[triggerName] = { main: [[]] };
    }

    stepInfos.forEach((info, i) => {
      const nextInfo = i < stepInfos.length - 1 ? stepInfos[i + 1] : null;
      const nextEntry = nextInfo?.entryName;

      if (info.isConditional) {
        const trueOutput: N8nConnectionEntry[] = [
          { node: info.stepName, type: "main", index: 0 },
        ];
        const falseOutput: N8nConnectionEntry[] = nextEntry
          ? [{ node: nextEntry, type: "main", index: 0 }]
          : [];

        connections[info.ifNodeName!] = {
          main: [trueOutput, falseOutput],
        };

        if (nextEntry) {
          connections[info.stepName] = {
            main: [[{ node: nextEntry, type: "main", index: 0 }]],
          };
        }
      } else {
        if (nextEntry) {
          connections[info.stepName] = {
            main: [[{ node: nextEntry, type: "main", index: 0 }]],
          };
        }
      }
    });

    return {
      name: dsl.name,
      nodes,
      connections,
      active: false,
      settings: {},
      tags: [],
    };
  }
}

AdapterRegistry.register(new N8nAdapter());
