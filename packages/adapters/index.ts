/**
 * Interface for platform-specific automation blueprint adapters.
 * 
 * Adapters convert standardized blueprint DSL into platform-specific
 * formats (Zapier, Make, n8n, Power Automate, etc.).
 * 
 * @public
 */
export interface Adapter {
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
   * @returns Platform-specific configuration object (structure varies by platform)
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
  toTargetFormat(dsl: unknown): unknown;

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
   *   toTargetFormat(dsl: any) { return {}; }
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
