export interface Adapter {
    /**
     * Target runtime identifier, e.g. "zapier", "make", "n8n".
     */
    runtime: string;
    /**
     * Convert blueprint DSL JSON into target runtime format (e.g., Zapier platform JSON).
     */
    toTargetFormat(dsl: unknown): unknown;
    /**
     * Return true if this adapter can handle the given DSL (e.g., runtime constraints).
     */
    canHandle?(dsl: unknown): boolean;
}
export declare class AdapterRegistry {
    private static adapters;
    static register(adapter: Adapter): void;
    static get(runtime: string): Adapter | undefined;
    static list(): string[];
}
import "./zapier-adapter";
import "./make-adapter";
import "./n8n-adapter";
import "./power-automate-adapter";
//# sourceMappingURL=index.d.ts.map