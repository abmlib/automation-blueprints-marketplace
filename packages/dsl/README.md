# @automation-blueprints/dsl

Shared Blueprint DSL schema and validator for the Automation Blueprints Marketplace.

## Installation

```bash
npm install @automation-blueprints/dsl
```

## Overview

This package provides JSON Schema validation for automation blueprint definitions. It ensures that blueprint configurations conform to the standardized DSL format before publishing or deployment.

## Usage

### Basic Validation

```typescript
import { validateDsl } from '@automation-blueprints/dsl';

const blueprint = {
  id: 'bp-slack-notification',
  name: 'Slack Notification on CRM Update',
  version: '1.0.0',
  apps: ['salesforce', 'slack'],
  scopes: ['crm', 'messaging'],
  trigger: {
    app: 'salesforce',
    event: 'record_updated'
  },
  retry: {
    attempts: 3,
    delayMs: 1000
  },
  steps: [
    {
      id: 'notify-team',
      app: 'slack',
      action: 'send_message',
      inputs: {
        channel: '#sales',
        text: 'New CRM update received'
      }
    }
  ]
};

const result = validateDsl(blueprint);

if (result.ok) {
  console.log('✓ Blueprint is valid');
} else {
  console.error('Validation errors:', result.errors);
}
```

### Accessing the Schema

```typescript
import { dslSchema } from '@automation-blueprints/dsl';

// Use the raw schema for custom validation or documentation
console.log(dslSchema);
```

You can also import the schema directly:

```typescript
import schema from '@automation-blueprints/dsl/schema.json';
```

## API Reference

### `validateDsl(dsl: unknown): ValidationResult`

Validates a blueprint object against the DSL schema.

**Parameters:**
- `dsl` - The blueprint object to validate (can be any type)

**Returns:** `ValidationResult` object with the following properties:
- `ok: boolean` - `true` if validation passed, `false` otherwise
- `errors?: string[]` - Array of human-readable error messages (only present if validation failed)
- `warnings?: string[]` - Array of warning messages (currently unused, reserved for future use)

**Example:**

```typescript
const result = validateDsl(myBlueprint);
if (!result.ok) {
  result.errors?.forEach(err => console.error(err));
}
```

### `dslSchema`

The exported JSON Schema object that defines the blueprint structure.

**Type:** JSON Schema Draft-07 object

**Schema ID:** `https://automation-blueprints.dev/schema/v0.1`

## Blueprint DSL Structure

A valid blueprint must include:

### Required Fields

- **`id`** (string): Unique identifier (alphanumeric, hyphens, underscores)
- **`name`** (string): Human-readable name (min 3 characters)
- **`version`** (string): Semantic version (e.g., "1.0.0")
- **`apps`** (string[]): Array of app identifiers used in the blueprint (min 1)
- **`trigger`** (object): The event that starts the automation
  - `app` (string): Source application
  - `event` (string): Event type
  - `filters` (optional): Array of filter conditions
- **`steps`** (array): Array of action steps (min 1)
  - Each step requires: `id`, `app`, `action`
  - Optional: `condition`, `inputs`, `outputs`, `transforms`

### Optional Fields

- **`scopes`** (string[]): Categorization tags (e.g., "crm", "marketing")
- **`retry`** (object): Retry configuration
  - `attempts` (integer): Number of retry attempts (min 1)
  - `delayMs` (integer): Delay between retries in milliseconds
- **`policies`** (object): Custom policy definitions
- **`fixtures`** (object): Test data fixtures
- **`tests`** (array): Test cases for the blueprint
- **`compatibility`** (object): Platform compatibility metadata

## Error Messages

Validation errors are returned in a human-readable format:

```
"steps: must have at least 1 items"
"trigger.app: is a required property"
"version: must match pattern ^\d+\.\d+\.\d+$"
```

## TypeScript Support

This package includes full TypeScript definitions. The `ValidationResult` interface is exported for type safety:

```typescript
import { ValidationResult, validateDsl } from '@automation-blueprints/dsl';

function checkBlueprint(data: unknown): ValidationResult {
  return validateDsl(data);
}
```

## Schema Versioning

Current schema version: **v0.1**

The schema follows semantic versioning. Breaking changes will result in a major version bump.

## Dependencies

- `ajv` ^8.12.0 - JSON Schema validator
- `ajv-formats` ^2.1.1 - Format validation (e.g., patterns, dates)

## License

See repository root for license information.

## Related Packages

- [`@automation-blueprints/adapters`](../adapters/README.md) - Runtime adapters for exporting blueprints to different platforms
