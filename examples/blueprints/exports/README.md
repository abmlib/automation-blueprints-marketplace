# Platform-Specific Export Examples

This directory contains examples of how blueprint DSL translates to different automation platforms. Each subdirectory shows the native format for a specific platform.

## Supported Platforms

### 1. Zapier (`zapier/`)
- Format: Zapier Developer Platform JSON
- Contains: triggers, searches, creates
- Use case: Publishing custom Zapier integrations

### 2. Make (Integromat) (`make/`)
- Format: Make Scenario JSON
- Contains: flow array with modules and metadata
- Use case: Importing scenarios into Make platform

### 3. n8n (`n8n/`)
- Format: n8n Workflow JSON
- Contains: nodes, connections, positioning
- Use case: Self-hosted workflow automation

### 4. Power Automate (`power-automate/`)
- Format: Microsoft Power Automate Flow Definition
- Contains: triggers, actions, logic apps schema
- Use case: Microsoft 365 integrations

## How Conversion Works

The adapter system transforms universal blueprint DSL into platform-specific formats:

```
Blueprint DSL → Adapter → Platform Format
```

### Example: Stripe Invoice Notification

**Original DSL:**
```json
{
  "trigger": {
    "app": "stripe",
    "event": "invoice.created"
  },
  "steps": [
    {
      "id": "send-notification",
      "app": "slack",
      "action": "send_message"
    }
  ]
}
```

**Zapier Output:**
```json
{
  "triggers": {
    "invoice.created": {
      "operation": {
        "perform": {
          "url": "https://example.com/trigger/invoice.created"
        }
      }
    }
  }
}
```

**Make Output:**
```json
{
  "flow": [
    { "id": 1, "module": "stripe:invoice.created" },
    { "id": 2, "module": "slack:send_message" }
  ]
}
```

**n8n Output:**
```json
{
  "nodes": [
    { "type": "n8n-nodes-base.webhook" },
    { "type": "n8n-nodes-base.slack" }
  ],
  "connections": { ... }
}
```

## Using Platform Exports

### Programmatic Conversion

```typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';
import blueprint from '../intermediate/stripe-invoice-notifications.json';

// Convert to Zapier
const zapierAdapter = AdapterRegistry.get('zapier');
const zapierConfig = zapierAdapter.toTargetFormat(blueprint);

// Convert to Make
const makeAdapter = AdapterRegistry.get('make');
const makeScenario = makeAdapter.toTargetFormat(blueprint);

// Convert to n8n
const n8nAdapter = AdapterRegistry.get('n8n');
const n8nWorkflow = n8nAdapter.toTargetFormat(blueprint);

// Convert to Power Automate
const powerAutomateAdapter = AdapterRegistry.get('power-automate');
const powerAutomateFlow = powerAutomateAdapter.toTargetFormat(blueprint);
```

### API Export

Use the Blueprint Marketplace API to export directly:

```bash
# Export to Zapier format
curl -X POST http://localhost:3001/api/blueprints/export \
  -H "Content-Type: application/json" \
  -d '{
    "blueprintId": "invoice-notification",
    "targetPlatform": "zapier"
  }' > zapier-export.json

# Export to n8n format
curl -X POST http://localhost:3001/api/blueprints/export \
  -H "Content-Type: application/json" \
  -d '{
    "blueprintId": "invoice-notification",
    "targetPlatform": "n8n"
  }' > n8n-workflow.json
```

## Platform-Specific Considerations

### Zapier
- Best for: SaaS integrations with existing Zapier apps
- Limitations: Requires Zapier Developer Platform account
- Deployment: Push to Zapier CLI or upload via UI

### Make (Integromat)
- Best for: Visual workflow building with complex branching
- Features: Visual designer coordinates included
- Import: Use Make's "Import Blueprint" feature

### n8n
- Best for: Self-hosted, open-source automation
- Features: Full expression support, custom nodes
- Import: Upload JSON via n8n UI or API

### Power Automate
- Best for: Microsoft 365 and Azure integrations
- Features: Deep Office 365 integration
- Import: Import flow definition in Power Automate portal

## Adapter Development

To add support for a new platform:

```typescript
import { Adapter, AdapterRegistry } from '@automation-blueprints/adapters';

class MyPlatformAdapter implements Adapter {
  runtime = 'my-platform';
  
  toTargetFormat(dsl: any) {
    // Transform DSL to platform format
    return {
      // Platform-specific structure
    };
  }
}

AdapterRegistry.register(new MyPlatformAdapter());
```

## Compatibility Matrix

| Blueprint Feature | Zapier | Make | n8n | Power Automate |
|------------------|--------|------|-----|----------------|
| Basic Triggers   | ✅     | ✅   | ✅  | ✅             |
| Multi-step       | ✅     | ✅   | ✅  | ✅             |
| Conditionals     | ✅     | ✅   | ✅  | ✅             |
| Loops            | ⚠️     | ✅   | ✅  | ✅             |
| Error Handling   | ⚠️     | ✅   | ✅  | ✅             |
| Parallel Paths   | ❌     | ✅   | ✅  | ✅             |

✅ Full support | ⚠️ Partial support | ❌ Not supported

## Further Reading

- [Adapter Source Code](../../../packages/adapters/)
- [API Export Documentation](../api/README.md)
- [Platform Import Guides](../../../docs/platform-imports/)
