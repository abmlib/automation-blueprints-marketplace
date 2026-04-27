# @automation-blueprints/adapters

Runtime adapters for exporting automation blueprints to different automation platforms.

## Installation

```bash
npm install @automation-blueprints/adapters
```

## Overview

This package provides adapters that convert standardized automation blueprint DSL into platform-specific formats for Zapier, Make (Integromat), n8n, and Microsoft Power Automate.

All adapters share a common `Adapter` interface with typed DSL inputs and platform-specific output types. Each adapter maps the full DSL surface including triggers, steps, transforms, conditions, retry policies, filters, outputs, and OAuth scopes to the target platform's native representation.

## Usage

### Quick Start

```typescript
import {
  AdapterRegistry,
  BlueprintDsl,
  ZapierPlatformOutput,
} from '@automation-blueprints/adapters';

const blueprint: BlueprintDsl = {
  id: 'crm-slack-notify',
  name: 'CRM to Slack Notification',
  version: '1.0.0',
  apps: ['salesforce', 'slack'],
  trigger: {
    app: 'salesforce',
    event: 'record_updated',
  },
  steps: [
    {
      id: 'send-notification',
      app: 'slack',
      action: 'post_message',
      inputs: {
        channel: '#sales',
        text: 'CRM update detected',
      },
    },
  ],
};

const adapter = AdapterRegistry.get('zapier');
if (adapter) {
  const output = adapter.toTargetFormat(blueprint) as ZapierPlatformOutput;
  console.log(JSON.stringify(output, null, 2));
}

// List all available adapters
console.log(AdapterRegistry.list());
// ['zapier', 'make', 'n8n', 'power-automate']
```

### Pre-Conversion Validation

```typescript
const adapter = AdapterRegistry.get('make');

// Check if the adapter can handle this blueprint
if (adapter?.canHandle?.(blueprint)) {
  const output = adapter.toTargetFormat(blueprint);
}

// Get warnings about unsupported DSL features
const warnings = adapter?.detectUnsupportedFeatures?.(blueprint);
if (warnings?.length) {
  console.warn('Unsupported features:', warnings);
}
```

### Advanced DSL Features

```typescript
import { BlueprintDsl } from '@automation-blueprints/adapters';

const blueprint: BlueprintDsl = {
  id: 'advanced-flow',
  name: 'Advanced Flow',
  version: '1.0.0',
  apps: ['hubspot', 'slack', 'pandadoc'],
  trigger: {
    app: 'hubspot',
    event: 'deal_closed',
    filters: [
      { field: 'amount', operator: 'gte', value: 1000 },
    ],
  },
  steps: [
    {
      id: 'notify',
      app: 'slack',
      action: 'post_message',
      condition: 'amount > 5000',
      inputs: { channel: '#big-deals' },
      outputs: ['messageId', 'timestamp'],
      transforms: [
        { field: 'text', operation: 'template', value: 'Deal closed: {{name}}' },
      ],
    },
  ],
  scopes: ['hubspot.deals.read', 'slack.chat:write'],
  retry: { attempts: 3, delayMs: 5000 },
};
```

## API Reference

### `AdapterRegistry`

Central registry for managing platform adapters.

#### Static Methods

##### `AdapterRegistry.register(adapter: Adapter): void`

Registers a new adapter. Typically used internally by built-in adapters.

##### `AdapterRegistry.get(runtime: string): Adapter | undefined`

Retrieves an adapter by runtime identifier.

**Parameters:**
- `runtime` - Platform identifier (`'zapier'`, `'make'`, `'n8n'`, `'power-automate'`)

##### `AdapterRegistry.list(): string[]`

Lists all registered adapter runtime identifiers.

---

### `Adapter<TOutput>` Interface

All adapters implement this interface.

```typescript
interface Adapter<TOutput = unknown> {
  runtime: string;
  toTargetFormat(dsl: unknown): TOutput;
  canHandle?(dsl: unknown): boolean;
  detectUnsupportedFeatures?(dsl: unknown): string[];
}
```

| Method | Required | Description |
|--------|----------|-------------|
| `toTargetFormat(dsl)` | Yes | Converts blueprint DSL to the target platform's native format |
| `canHandle?(dsl)` | No | Validates whether the adapter can process the given DSL |
| `detectUnsupportedFeatures?(dsl)` | No | Returns human-readable warnings for DSL features the adapter cannot translate |

---

### DSL Input Types

The package exports typed interfaces for the blueprint DSL:

| Type | Description |
|------|-------------|
| `BlueprintDsl` | Root blueprint object with trigger, steps, scopes, retry, policies |
| `BlueprintDslTrigger` | Trigger definition with app, event, and optional filters |
| `BlueprintDslStep` | Step with id, app, action, condition, inputs, outputs, transforms |
| `BlueprintDslFilter` | Trigger filter condition (field, operator, value) |
| `BlueprintDslTransform` | Field-level transform (field, operation, value) |
| `BlueprintDslRetry` | Retry configuration (attempts, delayMs) |

### Platform Output Types

Each adapter produces a typed output:

| Type | Adapter | Description |
|------|---------|-------------|
| `ZapierPlatformOutput` | Zapier | Developer Platform app definition with triggers, searches, creates |
| `MakeScenarioOutput` | Make | Scenario blueprint with flow array and module definitions |
| `N8nWorkflowOutput` | n8n | Workflow JSON with nodes and connections |
| `PowerAutomateWorkflowOutput` | Power Automate | Azure Logic Apps workflow definition |

## Supported Platforms

### Zapier

**Runtime ID:** `zapier`

Exports to the Zapier Developer Platform app definition format.

**DSL mapping:**
- Steps map to `creates` (keyed by step ID) with `inputFields`, `outputFields`, and `perform` URL
- Trigger maps to `triggers` entry with app-specific `perform` endpoint
- `scopes[]` mapped to `authentication.oauth2Config.scope`
- `retry` mapped to `perform.retry`
- `step.transforms` mapped to `outputFields`

### Make (Integromat)

**Runtime ID:** `make`

Exports to the Make scenario blueprint format.

**DSL mapping:**
- Steps map to flow modules with `mapper` (from transforms) and `parameters` (from inputs)
- `trigger.filters[]` mapped to Make `filter` modules with native `conditions` array
- `step.condition` parsed into `router` module with conditional `routes`
- `step.outputs[]` mapped to `metadata.expect` entries
- `retry` mapped to `onerror` retry modules

### n8n

**Runtime ID:** `n8n`

Exports to the n8n workflow JSON format.

**DSL mapping:**
- Trigger type dynamically resolved from `trigger.app` (not hardcoded to webhook)
- Steps map to nodes with full connection wiring between them
- `step.condition` parsed into `n8n-nodes-base.if` nodes with branching connections
- `retry` mapped to `retryOnFail`, `maxTries`, `waitBetweenTries` on each node
- Automatic node positioning in the visual editor

### Microsoft Power Automate

**Runtime ID:** `power-automate`

Exports to the Azure Logic Apps workflow definition schema.

**DSL mapping:**
- Steps map to actions with `runAfter` dependency chaining
- `trigger.filters[]` mapped to trigger `conditions` expressions
- `step.condition` parsed into `If` actions with `actions` and `else.actions` branches
- `step.outputs[]` mapped to action output schemas
- `retry` mapped to `retryPolicy` with count and interval
- Output conforms to `$schema: https://schema.management.azure.com/...`

## Creating Custom Adapters

```typescript
import { Adapter, AdapterRegistry } from '@automation-blueprints/adapters';

interface MyPlatformOutput {
  workflowName: string;
  tasks: Array<{ name: string; config: Record<string, unknown> }>;
}

class MyPlatformAdapter implements Adapter<MyPlatformOutput> {
  runtime = 'my-platform';

  toTargetFormat(dsl: any): MyPlatformOutput {
    return {
      workflowName: dsl.name,
      tasks: (dsl.steps ?? []).map((s: any) => ({
        name: s.id,
        config: s.inputs ?? {},
      })),
    };
  }

  canHandle(dsl: any): boolean {
    return Array.isArray(dsl.steps) && dsl.steps.length > 0;
  }

  detectUnsupportedFeatures(dsl: any): string[] {
    const warnings: string[] = [];
    if (dsl.retry) warnings.push('Retry config is not supported by my-platform');
    return warnings;
  }
}

AdapterRegistry.register(new MyPlatformAdapter());
```

## Testing

Run the full test suite (133+ test cases across all four adapters):

```bash
npm test
```

## Dependencies

This package has no runtime dependencies.

## License

See repository root for license information.

## Related Packages

- [`@automation-blueprints/dsl`](../dsl/README.md) - DSL schema and validation
