# Intermediate Blueprint Examples

This directory contains multi-step blueprint examples that demonstrate data transformation, conditional logic, and sequential workflows.

## Examples in This Directory

### 1. Stripe Invoice Slack Notifications (`stripe-invoice-notifications.json`)

**What it does:** Sends beautifully formatted Slack notifications with rich attachments when new invoices are created in Stripe.

**Complexity:** Intermediate  
**Apps used:** Stripe, Slack, Formatter  
**Steps:** 2

**Use cases:**
- Billing team notifications
- Invoice tracking
- Customer payment alerts
- Financial reporting

**Key concepts demonstrated:**
- Multi-step workflows
- Data transformation with formatter
- Step output references ({{steps.format-message.formatted_text}})
- Rich Slack message formatting with attachments
- Structured data extraction from webhook payloads
- Fixture testing data

## Key Differences from Basic Examples

Intermediate blueprints introduce:

1. **Multiple Steps:** Actions are chained together sequentially
2. **Data Flow:** Output from one step feeds into the next using `{{steps.step-id.output-field}}`
3. **Transformation:** Data is formatted, filtered, or enriched before final action
4. **Rich Outputs:** Complex data structures like Slack attachments

## Common Patterns in Intermediate Workflows

### Pattern 1: Transform → Action

```
Trigger → Transform Data → Send Notification
```

Example: Format invoice data before sending to Slack

### Pattern 2: Enrich → Route

```
Trigger → Enrich with API Data → Route to Different Channels
```

Example: Look up customer details, then route to appropriate team channel

### Pattern 3: Validate → Process

```
Trigger → Validate Data → Create Record or Send Alert
```

Example: Check if data meets criteria before creating CRM entry

## Testing Intermediate Blueprints

### Using Fixtures

All intermediate examples include `fixtures` for testing:

```typescript
import blueprint from './stripe-invoice-notifications.json';

// Access test data
const testPayload = blueprint.fixtures.trigger;

// Simulate trigger
console.log('Test invoice:', testPayload.invoice.number);
// Output: Test invoice: INV-001
```

### Step Output Testing

When testing multi-step workflows, verify each step's output:

```typescript
// Step 1 output
const formattedMessage = "New invoice #INV-001 for $1500 created for Acme Corp";

// Step 2 uses Step 1's output
const slackMessage = {
  channel: "#billing",
  text: formattedMessage,
  attachments: [...]
};
```

## Platform Compatibility

All intermediate examples are tested against:
- **Zapier:** v8.0.0+
- **Make (Integromat):** v1.5.0+
- **n8n:** v0.150.0+

See [exports directory](../exports/) for platform-specific output formats.

## Next Steps

- Try modifying step inputs to customize behavior
- Add additional transformation steps
- Explore [advanced examples](../advanced/) for complex conditional logic and parallel workflows
- Review the [API examples](../api/) to learn how to deploy these blueprints programmatically
