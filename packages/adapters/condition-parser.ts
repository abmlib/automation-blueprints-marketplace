/**
 * Represents a parsed DSL condition expression.
 *
 * Produced by {@link parseCondition} from a raw condition string such as
 * `"{{steps.kyc-check.status}} === \"approved\""`.
 */
export interface ParsedCondition {
  stepId: string;
  field: string;
  operator: string;
  value: string | number | boolean;
}

const JS_OPERATOR_MAP: Record<string, string> = {
  "===": "equals",
  "==": "equals",
  "!==": "not_equals",
  "!=": "not_equals",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
};

/**
 * Parses a DSL condition string into a structured {@link ParsedCondition}.
 *
 * Supports the template reference format
 * `{{steps.<stepId>.<field>}} <op> <value>` where `<op>` is a
 * JavaScript-style comparison operator (`===`, `==`, `!==`, `!=`,
 * `>`, `>=`, `<`, `<=`) and `<value>` is a string literal
 * (double- or single-quoted), a numeric literal, or a boolean keyword.
 *
 * @returns The parsed condition, or `null` if the string does not match
 *   the expected format.
 */
export function parseCondition(condition: string): ParsedCondition | null {
  const match = condition.match(
    /^\{\{steps\.([^.}]+)\.([^}]+)\}\}\s*(===?|!==?|>=?|<=?)\s*(.+)$/,
  );
  if (!match) return null;

  const [, stepId, field, jsOperator, rawValue] = match;

  const trimmed = rawValue.trim();
  let value: string | number | boolean;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    value = trimmed.slice(1, -1);
  } else if (trimmed === "true") {
    value = true;
  } else if (trimmed === "false") {
    value = false;
  } else if (trimmed !== "" && !isNaN(Number(trimmed))) {
    value = Number(trimmed);
  } else {
    value = trimmed;
  }

  return {
    stepId,
    field,
    operator: JS_OPERATOR_MAP[jsOperator] ?? "equals",
    value,
  };
}
