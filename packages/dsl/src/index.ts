import Ajv, { Schema, ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - compiled json import
import schemaJson from './schema.json';

/**
 * Result of blueprint DSL validation.
 * 
 * @public
 */
export interface ValidationResult {
  /**
   * True if validation passed, false otherwise.
   */
  ok: boolean;
  /**
   * Array of human-readable error messages.
   * Only present if validation failed.
   */
  errors?: string[];
  /**
   * Array of warning messages.
   * Reserved for future use (currently always empty).
   */
  warnings?: string[];
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validateFn: ValidateFunction = ajv.compile(schemaJson as Schema);

/**
 * Validates an automation blueprint object against the DSL JSON Schema.
 * 
 * Checks that the blueprint conforms to the standardized automation blueprint
 * format including required fields (id, name, version, apps, trigger, steps)
 * and optional fields (scopes, retry, policies, fixtures, tests, compatibility).
 * 
 * @param dsl - The blueprint object to validate (can be any type)
 * @returns Validation result containing success flag and any error messages
 * 
 * @example
 * ```typescript
 * const blueprint = {
 *   id: 'bp-1',
 *   name: 'My Blueprint',
 *   version: '1.0.0',
 *   apps: ['slack'],
 *   trigger: { app: 'slack', event: 'message' },
 *   steps: [{ id: 's1', app: 'slack', action: 'send' }]
 * };
 * 
 * const result = validateDsl(blueprint);
 * if (!result.ok) {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 * 
 * @public
 */
export function validateDsl(dsl: unknown): ValidationResult {
  const ok = validateFn(dsl);
  return {
    ok: !!ok,
    errors: validateFn.errors?.map((e) => {
      const instancePath = e.instancePath ? e.instancePath.replace(/^\//, "") : "";
      const property = instancePath || e.params.missingProperty || "";
      const message = e.message ?? "validation error";
      return `${property ? `${property}: ` : ""}${message}`;
    }),
    warnings: [],
  };
}

/**
 * The complete JSON Schema (Draft-07) definition for automation blueprints.
 * 
 * This schema defines the structure, required fields, and validation rules
 * for automation blueprint DSL v0.1.
 * 
 * @remarks
 * Schema ID: https://automation-blueprints.dev/schema/v0.1
 * 
 * @public
 */
export { schemaJson as dslSchema };
