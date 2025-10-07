# Basic Blueprint Examples

This directory contains simple, single-step blueprint examples ideal for getting started with automation blueprints.

## Examples in This Directory

### 1. HubSpot to Slack Notifications (`hubspot-slack-simple.json`)

**What it does:** Sends a Slack notification whenever a new lead is created in HubSpot.

**Complexity:** Beginner  
**Apps used:** HubSpot, Slack  
**Steps:** 1

**Use cases:**
- Sales team notifications
- Lead tracking
- Real-time alerts

**Key concepts demonstrated:**
- Simple trigger configuration
- Webhook filtering
- Template variable substitution
- Single-step workflow

## How to Use These Examples

### 1. Validation

Validate any blueprint using the DSL validator:

```bash
npx ts-node ../sdk-usage/validate-blueprint.ts
```

Or programmatically:

```typescript
import { validateDsl } from '@automation-blueprints/dsl';
import blueprint from './hubspot-slack-simple.json';

const result = validateDsl(blueprint);
if (result.ok) {
  console.log('Blueprint is valid!');
} else {
  console.error('Errors:', result.errors);
}
```

### 2. Platform Export

Export to your automation platform:

```typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';
import blueprint from './hubspot-slack-simple.json';

const adapter = AdapterRegistry.get('zapier'); // or 'make', 'n8n', 'power-automate'
const platformConfig = adapter.toTargetFormat(blueprint);
console.log(JSON.stringify(platformConfig, null, 2));
```

### 3. API Integration

Import via the Blueprint Marketplace API:

```bash
curl -X POST http://localhost:3001/api/blueprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @hubspot-slack-simple.json
```

## Next Steps

Once you're comfortable with basic blueprints:
- Check out [intermediate examples](../intermediate/) for multi-step workflows
- Explore [advanced examples](../advanced/) for complex business processes
- Review [platform-specific exports](../exports/) to see how blueprints translate to different platforms
