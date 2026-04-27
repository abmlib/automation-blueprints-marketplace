import {
  Adapter, AdapterRegistry, BlueprintDsl,
  ZapierPlatformOutput, ZapierInputField, ZapierOutputField,
  ZapierOperationEntry, ZapierOperation, ZapierPerform,
  ZapierAuthentication,
} from "./index";

const SEARCH_ACTION_KEYWORDS = [
  "find",
  "search",
  "get",
  "lookup",
  "list",
  "fetch",
  "retrieve",
  "query",
  "read",
];

/**
 * Determines whether a DSL action string has search/read semantics based on
 * well-known verb keywords. Matches whole keywords separated by underscores.
 */
function isSearchAction(action: string): boolean {
  const lower = action.toLowerCase();
  return SEARCH_ACTION_KEYWORDS.some(
    (kw) =>
      lower === kw ||
      lower.startsWith(`${kw}_`) ||
      lower.endsWith(`_${kw}`) ||
      lower.includes(`_${kw}_`),
  );
}

/**
 * Maps a JavaScript runtime type to the closest Zapier inputField type.
 */
function inferZapierFieldType(value: unknown): string {
  if (typeof value === "string") return "string";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "number";
  if (typeof value === "boolean") return "boolean";
  return "text";
}

/**
 * Adapter for converting blueprints to Zapier platform format.
 *
 * Generates Zapier-compatible JSON including trigger definitions,
 * searches, and creates for use with the Zapier Developer Platform.
 *
 * - DSL steps are classified as **searches** when the action verb has
 *   read/query semantics, and as **creates** otherwise.
 * - Trigger URLs use `{{bundle.authData.baseUrl}}` so the endpoint is
 *   configurable at integration-setup time rather than hard-coded.
 * - `trigger.filters` are mapped to the trigger operation's `inputFields`.
 * - `step.transforms` and `step.outputs` are mapped to `outputFields`.
 * - `canHandle` rejects blueprints that use `policies` or step-level
 *   `condition` branching, which have no native Zapier equivalent.
 *
 * @internal
 */
class ZapierAdapter implements Adapter<ZapierPlatformOutput> {
  runtime = "zapier";

  /**
   * Converts blueprint DSL to Zapier platform format.
   *
   * @param dsl - Blueprint object in DSL format
   * @returns Zapier platform JSON with triggers, searches, and creates
   */
  toTargetFormat(dsl: BlueprintDsl): ZapierPlatformOutput {
    const trigger = dsl.trigger;
    const steps = dsl.steps;
    const filters = trigger.filters ?? [];

    const triggerKey = trigger.event;
    const triggerApp = trigger.app;

    const triggerInputFields: ZapierInputField[] = filters.map((f) => ({
      key: f.field,
      type: "string",
      label: f.field,
      helpText: `Filter: ${f.field} ${f.operator} ${f.value}`,
      default: typeof f.value === "string" ? f.value : JSON.stringify(f.value),
    }));

    const triggers: Record<string, ZapierOperationEntry> = {
      [triggerKey]: {
        key: triggerKey,
        noun: triggerApp,
        display: {
          label: `${triggerApp} — ${triggerKey}`,
          description: `Triggers when ${triggerKey} occurs in ${triggerApp}`,
        },
        operation: {
          inputFields: triggerInputFields,
          perform: {
            url: `{{bundle.authData.baseUrl}}/${triggerApp}/${triggerKey}`,
            method: "GET",
          },
        },
      },
    };

    const searches: Record<string, ZapierOperationEntry> = {};
    const creates: Record<string, ZapierOperationEntry> = {};

    steps.forEach((step) => {
      const action = step.action;
      const key = step.id;
      const app = step.app;
      const search = isSearchAction(action);

      const inputFields: ZapierInputField[] = Object.entries(step.inputs ?? {}).map(([k, v]) => ({
        key: k,
        type: inferZapierFieldType(v),
        default: v,
      }));

      const outputFieldMap = new Map<string, ZapierOutputField>();
      if (Array.isArray(step.outputs)) {
        step.outputs.forEach((field) => {
          outputFieldMap.set(field, { key: field, type: "string" });
        });
      }
      if (Array.isArray(step.transforms)) {
        step.transforms.forEach((t) => {
          outputFieldMap.set(t.field, {
            key: t.field,
            type: "string",
            label: `${t.field} (${t.operation})`,
          });
        });
      }
      const outputFields = [...outputFieldMap.values()];

      const perform: ZapierPerform = {
        url: `{{bundle.authData.baseUrl}}/${app}/${action}`,
        method: search ? "GET" : "POST",
      };
      if (search) {
        perform.params = step.inputs ?? {};
      } else {
        perform.body = step.inputs ?? {};
      }

      const operation: ZapierOperation = {
        inputFields,
        perform,
      };
      if (outputFields.length > 0) {
        operation.outputFields = outputFields;
      }

      const entry: ZapierOperationEntry = {
        key,
        noun: app,
        display: {
          label: `${app} — ${action}`,
          description: `Perform ${action} on ${app}`,
        },
        operation,
      };

      if (search) {
        searches[key] = entry;
      } else {
        creates[key] = entry;
      }
    });

    const output: ZapierPlatformOutput = {
      name: dsl.name,
      version: dsl.version,
      triggers,
      searches,
      creates,
    };

    if (dsl.scopes && dsl.scopes.length > 0) {
      const authentication: ZapierAuthentication = {
        oauth2Config: { scope: dsl.scopes.join(" ") },
      };
      output.authentication = authentication;
    }

    return output;
  }

  detectUnsupportedFeatures(dsl: unknown): string[] {
    const d = dsl as Partial<BlueprintDsl>;
    const warnings: string[] = [];

    if (d.retry) {
      warnings.push("Blueprint 'retry' configuration is not natively supported in the Zapier platform schema and was omitted from the export.");
    }
    if (d.policies && Object.keys(d.policies).length > 0) {
      warnings.push("Blueprint 'policies' are not supported by Zapier and were omitted from the export.");
    }

    const steps = d.steps ?? [];
    const conditionSteps = steps.filter((s) => s.condition).map((s) => s.id);
    if (conditionSteps.length > 0) {
      warnings.push(
        `Step-level 'condition' on [${conditionSteps.join(", ")}] is not supported by Zapier and was omitted from the export.`,
      );
    }

    return warnings;
  }

  /**
   * Returns `false` when the blueprint uses DSL features that have no native
   * Zapier equivalent — specifically `policies` and step-level `condition`
   * branching.
   */
  canHandle(dsl: unknown): boolean {
    const d = dsl as Partial<BlueprintDsl>;
    if (d.policies && Object.keys(d.policies).length > 0) {
      return false;
    }

    const steps = d.steps ?? [];
    if (steps.some((step) => step.condition)) {
      return false;
    }

    return true;
  }
}

AdapterRegistry.register(new ZapierAdapter());
