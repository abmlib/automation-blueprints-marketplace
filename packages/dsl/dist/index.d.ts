import schemaJson from './schema.json';
export interface ValidationResult {
    ok: boolean;
    errors?: string[];
    warnings?: string[];
}
export declare function validateDsl(dsl: unknown): ValidationResult;
export { schemaJson as dslSchema };
//# sourceMappingURL=index.d.ts.map