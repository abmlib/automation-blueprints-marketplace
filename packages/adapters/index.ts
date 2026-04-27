// ── Blueprint DSL Input Types ────────────────────────────────────────

/** A single filter condition on a blueprint trigger. */
export interface BlueprintDslFilter {
  field: string;
  operator: string;
  value: unknown;
}

/** A field-level transform within a blueprint step. */
export interface BlueprintDslTransform {
  field: string;
  operation: string;
  value?: unknown;
}

/** The trigger definition within a blueprint DSL. */
export interface BlueprintDslTrigger {
  app: string;
  event: string;
  filters?: BlueprintDslFilter[];
}

/** A single step within a blueprint DSL. */
export interface BlueprintDslStep {
  id: string;
  app: string;
  action: string;
  condition?: string;
  inputs?: Record<string, unknown>;
  outputs?: string[];
  transforms?: BlueprintDslTransform[];
}

/**
 * TypeScript representation of the automation blueprint DSL.
 *
 * Mirrors the required fields defined in `packages/dsl/src/schema.json`.
 *
 * @public
 */
/** Retry configuration at the blueprint level. */
export interface BlueprintDslRetry {
  attempts: number;
  delayMs: number;
}

export interface BlueprintDsl {
  id: string;
  name: string;
  version: string;
  apps: string[];
  trigger: BlueprintDslTrigger;
  steps: BlueprintDslStep[];
  scopes?: string[];
  retry?: BlueprintDslRetry;
  policies?: Record<string, unknown>;
}

// ── Zapier Platform Output Types ─────────────────────────────────────

export interface ZapierInputField {
  key: string;
  type: string;
  label?: string;
  helpText?: string;
  default?: unknown;
}

export interface ZapierOutputField {
  key: string;
  type: string;
  label?: string;
}

export interface ZapierPerform {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface ZapierOperationDisplay {
  label: string;
  description: string;
}

export interface ZapierOperation {
  inputFields: ZapierInputField[];
  perform: ZapierPerform;
  outputFields?: ZapierOutputField[];
}

export interface ZapierOperationEntry {
  key: string;
  noun: string;
  display: ZapierOperationDisplay;
  operation: ZapierOperation;
}

export interface ZapierOAuth2Config {
  scope: string;
}

export interface ZapierAuthentication {
  oauth2Config: ZapierOAuth2Config;
}

/**
 * Output structure for the Zapier Developer Platform JSON format.
 *
 * @public
 */
export interface ZapierPlatformOutput {
  name: string;
  version: string;
  triggers: Record<string, ZapierOperationEntry>;
  searches: Record<string, ZapierOperationEntry>;
  creates: Record<string, ZapierOperationEntry>;
  authentication?: ZapierAuthentication;
}

// ── Make Scenario Output Types ───────────────────────────────────────

export interface MakeExpectEntry {
  name: string;
  type: string;
  label: string;
  required: boolean;
}

export interface MakeModuleMetadata {
  designer: { x: number; y: number };
  restore: Record<string, unknown>;
  expect?: MakeExpectEntry[];
}

export interface MakeOnerrorEntry {
  module: string;
  mapper: Record<string, unknown>;
}

export interface MakeFilterCondition {
  a: string;
  o: string;
  b: unknown;
}

export interface MakeRoute {
  flow: MakeFlowModule[];
}

export interface MakeFlowModule {
  id: number;
  module: string;
  version: number;
  parameters: Record<string, unknown>;
  mapper: Record<string, unknown>;
  metadata: MakeModuleMetadata;
  onerror?: MakeOnerrorEntry[];
  routes?: MakeRoute[];
}

export interface MakeScenarioMetadata {
  version: number;
  scenario: { roundtrips: number; maxErrors: number };
}

/**
 * Output structure for the Make (Integromat) scenario import format.
 *
 * @public
 */
export interface MakeScenarioOutput {
  name: string;
  flow: MakeFlowModule[];
  metadata: MakeScenarioMetadata;
}

// ── n8n Workflow Output Types ────────────────────────────────────────

export interface N8nNode {
  parameters: Record<string, unknown>;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  webhookId?: string;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface N8nConnectionEntry {
  node: string;
  type: string;
  index: number;
}

export interface N8nNodeConnection {
  main: N8nConnectionEntry[][];
}

/**
 * Output structure for the n8n workflow JSON format.
 *
 * @public
 */
export interface N8nWorkflowOutput {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, N8nNodeConnection>;
  active: boolean;
  settings: Record<string, unknown>;
  tags: string[];
}

// ── Power Automate Workflow Output Types ──────────────────────────────

export interface PowerAutomateTriggerCondition {
  expression: string;
}

export interface PowerAutomateTrigger {
  type: string;
  kind: string;
  inputs: { schema: Record<string, unknown>; method: string };
  conditions?: PowerAutomateTriggerCondition[];
}

export interface PowerAutomateRetryPolicy {
  type: string;
  count: number;
  interval: string;
}

export interface PowerAutomateAction {
  type: string;
  inputs?: Record<string, unknown> | string;
  runAfter: Record<string, string[]>;
  retryPolicy?: PowerAutomateRetryPolicy;
  expression?: string;
  actions?: Record<string, PowerAutomateAction>;
  else?: { actions: Record<string, PowerAutomateAction> };
}

/**
 * Output structure for the Azure Logic Apps / Power Automate workflow
 * definition schema.
 *
 * @public
 */
export interface PowerAutomateWorkflowOutput {
  $schema: string;
  contentVersion: string;
  parameters: Record<string, unknown>;
  triggers: Record<string, PowerAutomateTrigger>;
  actions: Record<string, PowerAutomateAction>;
  outputs: Record<string, unknown>;
}

// ── Adapter Interface ────────────────────────────────────────────────

/**
 * Interface for platform-specific automation blueprint adapters.
 * 
 * Adapters convert standardized blueprint DSL into platform-specific
 * formats (Zapier, Make, n8n, Power Automate, etc.).
 * 
 * @typeParam TOutput - Platform-specific output type returned by
 *   {@link Adapter.toTargetFormat | toTargetFormat}. Defaults to
 *   `unknown` for generic/registry usage.
 * 
 * @public
 */
export interface Adapter<TOutput = unknown> {
  /**
   * Target runtime identifier.
   * 
   * @example "zapier", "make", "n8n", "power-automate"
   */
  runtime: string;
  
  /**
   * Converts blueprint DSL JSON into target runtime format.
   * 
   * @param dsl - Blueprint object in standardized DSL format
   * @returns Platform-specific configuration object
   * 
   * @example
   * ```typescript
   * const zapierConfig = adapter.toTargetFormat({
   *   name: 'My Blueprint',
   *   trigger: { app: 'webhook', event: 'new' },
   *   steps: [{ id: 's1', app: 'slack', action: 'send' }]
   * });
   * ```
   */
  toTargetFormat(dsl: unknown): TOutput;

  /**
   * Checks if this adapter can handle the given DSL.
   * 
   * Optional method for validating runtime-specific constraints
   * before conversion.
   * 
   * @param dsl - Blueprint object to check
   * @returns True if adapter supports this blueprint, false otherwise
   */
  canHandle?(dsl: unknown): boolean;

  /**
   * Detects DSL features present in the input that this adapter does
   * not translate to its target format.
   *
   * @param dsl - Blueprint object to inspect
   * @returns Array of human-readable warning strings, one per unsupported feature found
   */
  detectUnsupportedFeatures?(dsl: unknown): string[];
}

/**
 * Central registry for managing automation platform adapters.
 * 
 * Provides static methods to register, retrieve, and list adapters
 * for different automation platforms.
 * 
 * @remarks
 * Built-in adapters (Zapier, Make, n8n, Power Automate) are automatically
 * registered on import.
 * 
 * @public
 */
export class AdapterRegistry {
  private static adapters = new Map<string, Adapter>();

  /**
   * Registers a new adapter in the global registry.
   * 
   * @param adapter - Adapter instance implementing the Adapter interface
   * 
   * @example
   * ```typescript
   * class MyAdapter implements Adapter {
   *   runtime = 'my-platform';
   *   toTargetFormat(dsl: unknown) { return {}; }
   * }
   * 
   * AdapterRegistry.register(new MyAdapter());
   * ```
   */
  static register(adapter: Adapter) {
    this.adapters.set(adapter.runtime, adapter);
  }

  /**
   * Retrieves an adapter by its runtime identifier.
   * 
   * @param runtime - Platform identifier (e.g., "zapier", "make", "n8n")
   * @returns The adapter instance, or undefined if not found
   * 
   * @example
   * ```typescript
   * const adapter = AdapterRegistry.get('zapier');
   * if (adapter) {
   *   const output = adapter.toTargetFormat(blueprint);
   * }
   * ```
   */
  static get(runtime: string): Adapter | undefined {
    return this.adapters.get(runtime);
  }

  /**
   * Lists all registered adapter runtime identifiers.
   * 
   * @returns Array of runtime names
   * 
   * @example
   * ```typescript
   * const platforms = AdapterRegistry.list();
   * // ['zapier', 'make', 'n8n', 'power-automate']
   * ```
   */
  static list(): string[] {
    return [...this.adapters.keys()];
  }
}

// Auto-register built-in adapters. Keep at bottom to avoid circular deps issues.
import "./zapier-adapter";
import "./make-adapter";
import "./n8n-adapter";
import "./power-automate-adapter";
