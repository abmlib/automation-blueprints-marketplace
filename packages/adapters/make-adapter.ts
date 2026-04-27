import {
  Adapter, AdapterRegistry, BlueprintDsl, BlueprintDslFilter, BlueprintDslStep,
  MakeScenarioOutput, MakeFlowModule, MakeFilterCondition, MakeModuleMetadata,
  MakeOnerrorEntry,
} from "./index";
import { parseCondition, ParsedCondition } from "./condition-parser";

const MAKE_OPERATOR_MAP: Record<string, string> = {
  equals: "text:equal",
  eq: "text:equal",
  not_equals: "text:notequal",
  neq: "text:notequal",
  contains: "text:contain",
  not_contains: "text:notcontain",
  starts_with: "text:startswith",
  ends_with: "text:endswith",
  gt: "number:greater",
  greater_than: "number:greater",
  gte: "number:greaterequal",
  greater_than_or_equal: "number:greaterequal",
  lt: "number:less",
  less_than: "number:less",
  lte: "number:lessequal",
  less_than_or_equal: "number:lessequal",
};

function mapDslOperatorToMake(operator: string): string {
  return MAKE_OPERATOR_MAP[operator] ?? `text:${operator}`;
}

function buildMakeFilterConditions(
  filters: BlueprintDslFilter[],
  triggerModuleId: number,
): MakeFilterCondition[][] {
  return [
    filters.map((f) => ({
      a: `{{${triggerModuleId}.${f.field}}}`,
      o: mapDslOperatorToMake(f.operator),
      b: f.value,
    })),
  ];
}

function buildConditionFilterConditions(
  parsed: ParsedCondition,
  refModuleId: number,
): MakeFilterCondition[][] {
  return [
    [
      {
        a: `{{${refModuleId}.${parsed.field}}}`,
        o: mapDslOperatorToMake(parsed.operator),
        b: parsed.value,
      },
    ],
  ];
}

function buildSingleStepModule(
  step: BlueprintDslStep,
  moduleId: number,
  onerror: MakeOnerrorEntry[] | undefined,
  yPos: number,
): MakeFlowModule {
  const mapper: Record<string, unknown> = {};
  if (Array.isArray(step.transforms)) {
    step.transforms.forEach((t) => {
      if (t.field && t.operation) {
        mapper[t.field] = t.value !== undefined
          ? `{{${t.operation}(${t.value})}}`
          : `{{${t.operation}(${t.field})}}`;
      }
    });
  }

  const stepMetadata: MakeModuleMetadata = {
    designer: { x: 0, y: yPos },
    restore: {},
  };
  if (Array.isArray(step.outputs) && step.outputs.length > 0) {
    stepMetadata.expect = step.outputs.map((output) => ({
      name: output,
      type: "text",
      label: output,
      required: false,
    }));
  }

  const stepModule: MakeFlowModule = {
    id: moduleId,
    module: `${step.app}:${step.action}`,
    version: 1,
    parameters: step.inputs ?? {},
    mapper,
    metadata: stepMetadata,
  };
  if (onerror) {
    stepModule.onerror = onerror;
  }

  return stepModule;
}

/**
 * Recursively builds flow modules from DSL steps, inserting Router modules
 * with filtered routes for steps that have conditions.
 *
 * When a conditional step is encountered:
 * - Route 1 (filtered): BasicFilter + conditional step
 * - Route 2 (fallback): remaining steps (recursively processed)
 */
function buildStepModules(
  steps: BlueprintDslStep[],
  startIndex: number,
  idCounter: { value: number },
  stepIdToModuleId: Map<string, number>,
  onerror: MakeOnerrorEntry[] | undefined,
  idOffset: number,
): MakeFlowModule[] {
  const modules: MakeFlowModule[] = [];

  for (let i = startIndex; i < steps.length; i++) {
    const step = steps[i];
    const parsed = step.condition ? parseCondition(step.condition) : null;

    if (parsed) {
      const refModuleId = stepIdToModuleId.get(parsed.stepId);
      if (refModuleId === undefined) {
        const moduleId = idCounter.value++;
        stepIdToModuleId.set(step.id, moduleId);
        modules.push(
          buildSingleStepModule(step, moduleId, onerror, (i + idOffset) * 150),
        );
        continue;
      }

      const routerId = idCounter.value++;

      const filterId = idCounter.value++;
      const filterConditions = buildConditionFilterConditions(parsed, refModuleId);
      const filterModule: MakeFlowModule = {
        id: filterId,
        module: "builtin:BasicFilter",
        version: 1,
        parameters: {},
        mapper: { conditions: filterConditions },
        metadata: {
          designer: { x: 0, y: (i + idOffset) * 150 + 75 },
          restore: {},
        },
      };

      const stepModuleId = idCounter.value++;
      stepIdToModuleId.set(step.id, stepModuleId);
      const stepModule = buildSingleStepModule(
        step, stepModuleId, onerror, (i + idOffset) * 150 + 150,
      );

      const route1Flow: MakeFlowModule[] = [filterModule, stepModule];

      const route2Flow = buildStepModules(
        steps, i + 1, idCounter, stepIdToModuleId, onerror, idOffset,
      );

      const routerModule: MakeFlowModule = {
        id: routerId,
        module: "builtin:BasicRouter",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 0, y: (i + idOffset) * 150 },
          restore: {},
        },
        routes: [
          { flow: route1Flow },
          { flow: route2Flow },
        ],
      };

      modules.push(routerModule);
      break;
    } else {
      const moduleId = idCounter.value++;
      stepIdToModuleId.set(step.id, moduleId);
      modules.push(
        buildSingleStepModule(step, moduleId, onerror, (i + idOffset) * 150),
      );
    }
  }

  return modules;
}

/**
 * Adapter for converting blueprints to Make (Integromat) scenario format.
 * 
 * Generates Make-compatible scenario JSON with flow definitions,
 * module connections, and visual positioning for the Make platform.
 * 
 * @internal
 */
class MakeAdapter implements Adapter<MakeScenarioOutput> {
  runtime = "make";

  detectUnsupportedFeatures(dsl: unknown): string[] {
    const d = dsl as Partial<BlueprintDsl>;
    const warnings: string[] = [];

    if (d.scopes && d.scopes.length > 0) {
      warnings.push("Blueprint 'scopes' are not supported by Make and were omitted from the export.");
    }


    if (d.policies && Object.keys(d.policies).length > 0) {
      warnings.push("Blueprint 'policies' are not supported by Make and were omitted from the export.");
    }

    return warnings;
  }

  /**
   * Converts automation blueprint DSL to Make (Integromat) scenario format.
   * 
   * Creates a flow array with trigger and action modules, including
   * positioning metadata and parameter mappings.
   * 
   * @param dsl - Blueprint object in DSL format
   * @returns Make scenario JSON with flow array and metadata
   */
  canHandle(dsl: unknown): boolean {
    const d = dsl as Partial<BlueprintDsl>;
    if (d.policies && Object.keys(d.policies).length > 0) {
      return false;
    }
    return true;
  }

  toTargetFormat(dsl: BlueprintDsl): MakeScenarioOutput {
    const trigger = dsl.trigger;
    const steps = dsl.steps;
    const retry = dsl.retry;

    const onerror = retry
      ? [{
          module: "builtin:Retry",
          mapper: {
            count: String(retry.attempts),
            retry: true,
            interval: String(retry.delayMs),
          },
        }]
      : undefined;

    const triggerModuleId = 1;
    const filters = trigger.filters ?? [];
    const hasFilters = filters.length > 0;
    const idOffset = hasFilters ? 2 : 1;

    const triggerModule: MakeFlowModule = {
      id: triggerModuleId,
      module: `${trigger.app}:${trigger.event}`,
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
    };
    if (onerror) {
      triggerModule.onerror = onerror;
    }

    const flow: MakeFlowModule[] = [triggerModule];

    if (hasFilters) {
      const filterModule: MakeFlowModule = {
        id: 2,
        module: "builtin:BasicFilter",
        version: 1,
        parameters: {},
        mapper: {
          conditions: buildMakeFilterConditions(filters, triggerModuleId),
        },
        metadata: {
          designer: { x: 0, y: 75 },
          restore: {},
        },
      };
      flow.push(filterModule);
    }

    const idCounter = { value: hasFilters ? 3 : 2 };
    const stepIdToModuleId = new Map<string, number>();

    const stepModules = buildStepModules(
      steps, 0, idCounter, stepIdToModuleId, onerror, idOffset,
    );
    flow.push(...stepModules);

    return {
      name: dsl.name,
      flow,
      metadata: {
        version: 1,
        scenario: { roundtrips: 1, maxErrors: 3 },
      },
    };
  }
}

AdapterRegistry.register(new MakeAdapter());
