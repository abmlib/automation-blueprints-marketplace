# @automation-blueprints/adapters

Runtime adapters for exporting automation blueprints to different automation platforms.

## Installation

```bash
npm install @automation-blueprints/adapters
```

## Overview

This package provides adapters that convert standardized automation blueprint DSL into platform-specific formats for Zapier, Make (Integromat), n8n, and Microsoft Power Automate.

## Usage

### Quick Start

```typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';

const blueprint = {
  name: 'CRM to Slack Notification',
  version: '1.0.0',
  trigger: {
    app: 'salesforce',
    event: 'record_updated'
  },
  steps: [
    {
      id: 'send-notification',
      app: 'slack',
      action: 'post_message',
      inputs: {
        channel: '#sales',
        text: 'CRM update detected'
      }
    }
  ]
};

// Get the Zapier adapter
const zapierAdapter = AdapterRegistry.get('zapier');
if (zapierAdapter) {
  const zapierFormat = zapierAdapter.toTargetFormat(blueprint);
  console.log(JSON.stringify(zapierFormat, null, 2));
}

// List all available adapters
const availableRuntimes = AdapterRegistry.list();
console.log('Supported platforms:', availableRuntimes);
// Output: ['zapier', 'make', 'n8n', 'power-automate']
```

### Converting to n8n Format

```typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';

const adapter = AdapterRegistry.get('n8n');
const n8nWorkflow = adapter?.toTargetFormat({
  name: 'My Workflow',
  trigger: { app: 'webhook', event: 'incoming' },
  steps: [
    {
      id: 'process-data',
      app: 'set',
      action: 'set_value',
      inputs: { value: 'processed' }
    }
  ]
});

// Import into n8n using their API or UI
```

### Converting to Make (Integromat) Format

```typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';

const adapter = AdapterRegistry.get('make');
const makeScenario = adapter?.toTargetFormat({
  name: 'Data Sync Scenario',
  trigger: { app: 'webhook', event: 'data_received' },
  steps: [
    {
      id: 'transform',
      app: 'tools',
      action: 'set-variable',
      inputs: { variable: 'result' },
      transforms: [
        { field: 'email', operation: 'lowercase' }
      ]
    }
  ]
});
```

### Converting to Power Automate Format

```typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';

const adapter = AdapterRegistry.get('power-automate');
const powerAutomateFlow = adapter?.toTargetFormat({
  name: 'Automated Flow',
  trigger: { app: 'http', event: 'manual' },
  steps: [
    {
      id: 'compose-email',
      app: 'office365',
      action: 'send_email',
      inputs: {
        to: 'team@company.com',
        subject: 'Notification'
      }
    }
  ]
});
```

## API Reference

### `AdapterRegistry`

Central registry for managing platform adapters.

#### Static Methods

##### `AdapterRegistry.register(adapter: Adapter): void`

Registers a new adapter. Typically used internally by built-in adapters.

**Parameters:**
- `adapter` - An object implementing the `Adapter` interface

##### `AdapterRegistry.get(runtime: string): Adapter | undefined`

Retrieves an adapter by runtime identifier.

**Parameters:**
- `runtime` - Platform identifier ('zapier', 'make', 'n8n', 'power-automate')

**Returns:** The adapter instance, or `undefined` if not found

##### `AdapterRegistry.list(): string[]`

Lists all registered adapter runtime identifiers.

**Returns:** Array of runtime names

---

### `Adapter` Interface

All adapters implement this interface.

```typescript
interface Adapter {
  runtime: string;
  toTargetFormat(dsl: unknown): unknown;
  canHandle?(dsl: unknown): boolean;
}
```

#### Properties

- **`runtime`** (string): Platform identifier (e.g., "zapier", "n8n")

#### Methods

##### `toTargetFormat(dsl: unknown): unknown`

Converts blueprint DSL to the target platform's format.

**Parameters:**
- `dsl` - Blueprint object in DSL format

**Returns:** Platform-specific format (object structure varies by platform)

##### `canHandle?(dsl: unknown): boolean` *(optional)*

Checks if the adapter can process the given DSL (e.g., runtime constraints).

**Parameters:**
- `dsl` - Blueprint object to check

**Returns:** `true` if the adapter supports this blueprint, `false` otherwise

## Supported Platforms

### Zapier

**Runtime ID:** `zapier`

**Output Format:** Zapier platform JSON with `triggers`, `searches`, and `creates` objects.

**Example Output:**
```json
{
  "name": "automation-blueprint",
  "version": "0.1.0",
  "triggers": {
    "trigger_event": {
      "operation": {
        "perform": {
          "url": "https://example.com/trigger/trigger_event",
          "method": "POST"
        }
      }
    }
  },
  "searches": {},
  "creates": {}
}
```

### Make (Integromat)

**Runtime ID:** `make`

**Output Format:** Make scenario JSON with `flow` array and module definitions.

**Features:**
- Visual flow positioning
- Module parameter mapping
- Transform operations

### n8n

**Runtime ID:** `n8n`

**Output Format:** n8n workflow JSON with `nodes` and `connections`.

**Features:**
- Node positioning
- Webhook triggers
- Expression-based transforms
- Connection management

### Microsoft Power Automate

**Runtime ID:** `power-automate`

**Output Format:** Azure Logic Apps workflow definition schema.

**Features:**
- Trigger and action mapping
- RunAfter dependencies
- Compose actions for transforms

## Creating Custom Adapters

You can extend the system with custom adapters:

```typescript
import { Adapter, AdapterRegistry } from '@automation-blueprints/adapters';

class MyPlatformAdapter implements Adapter {
  runtime = 'my-platform';

  toTargetFormat(dsl: any) {
    return {
      platformSpecificField: dsl.name,
      // ... your conversion logic
    };
  }

  canHandle(dsl: any): boolean {
    // Optional: add constraints
    return true;
  }
}

// Register your adapter
AdapterRegistry.register(new MyPlatformAdapter());

// Use it
const adapter = AdapterRegistry.get('my-platform');
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions.

```typescript
import { Adapter, AdapterRegistry } from '@automation-blueprints/adapters';

const adapter: Adapter | undefined = AdapterRegistry.get('zapier');
const runtimes: string[] = AdapterRegistry.list();
```

## Testing

The package includes comprehensive tests for all adapters. Run tests with:

```bash
npm test
```

## Dependencies

This package has no runtime dependencies, making it lightweight and easy to integrate.

## License

See repository root for license information.

## Related Packages

- [`@automation-blueprints/dsl`](../dsl/README.md) - DSL schema and validation

