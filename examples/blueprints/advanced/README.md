# Advanced Blueprint Examples

This directory contains complex, production-ready blueprint examples demonstrating conditional logic, multi-app integrations, error handling, and automated testing.

## Examples in This Directory

### 1. Lead to Contract Automation (`lead-to-contract-automation.json`)

**What it does:** Fully automates the lead-to-contract workflow including KYC verification and document generation.

**Complexity:** Advanced  
**Apps used:** HubSpot, Sumsub, PandaDoc, Slack  
**Steps:** 3 (with conditional execution)

**Business Process:**
1. New lead created in HubSpot (trigger)
2. Initiate KYC verification via Sumsub
3. Generate contract in PandaDoc (only if KYC approved)
4. Notify sales team in Slack with signing link

**Use cases:**
- Financial services onboarding
- Legal document automation
- Compliance workflows
- B2B customer onboarding

**Advanced features demonstrated:**
- **Conditional execution:** `condition: "{{steps.kyc-check.status}} === \"approved\""`
- **Multi-app orchestration:** 4 different platforms
- **Step outputs:** Each step declares outputs for downstream use
- **Test specifications:** Automated test expectations
- **Complex data mapping:** Nested object references

---

### 2. GitHub Issue to Notion Tracker (`github-notion-tracker.json`)

**What it does:** Automatically creates Notion database entries with rich formatting when GitHub issues are opened.

**Complexity:** Advanced  
**Apps used:** GitHub, Notion  
**Steps:** 1 (with complex nested data structures)

**Business Process:**
1. Issue opened in GitHub repository (with filter)
2. Create Notion page with structured properties
3. Map labels to priority levels
4. Include issue body as formatted content

**Use cases:**
- Product issue tracking
- Cross-platform project management
- Developer workflow automation
- Bug triage systems

**Advanced features demonstrated:**
- **Nested data structures:** Complex Notion block creation
- **Conditional expressions:** Priority based on label check
- **Rich text formatting:** Notion rich_text objects
- **Repository filtering:** Only processes specific repositories
- **Array mapping:** Assignees array handling

## Advanced Concepts

### 1. Conditional Execution

Steps can include conditions that must be met before execution:

```json
{
  "id": "create-contract",
  "condition": "{{steps.kyc-check.status}} === \"approved\"",
  "app": "pandadoc",
  "action": "create_document"
}
```

**Supported operators:**
- `===`, `!==` (equality)
- `>`, `<`, `>=`, `<=` (comparison)
- `&&`, `||` (logical)
- `.includes()`, `.startsWith()`, `.endsWith()` (string methods)

### 2. Step Outputs

Declare outputs to make step results available downstream:

```json
{
  "id": "kyc-check",
  "outputs": ["applicant_id", "verification_url"]
}
```

Access in later steps:
```
{{steps.kyc-check.applicant_id}}
{{steps.kyc-check.verification_url}}
```

### 3. Automated Tests

Define test cases with expected outcomes:

```json
{
  "tests": [
    {
      "name": "should create KYC check for new lead",
      "input": "{{fixtures.trigger}}",
      "expectations": [
        {
          "step": "kyc-check",
          "field": "externalUserId",
          "value": "12345"
        }
      ]
    }
  ]
}
```

### 4. Complex Data Mapping

Map nested objects and arrays:

```json
{
  "recipients": [
    {
      "email": "{{trigger.contact.email}}",
      "first_name": "{{trigger.contact.firstname}}",
      "last_name": "{{trigger.contact.lastname}}",
      "role": "client"
    }
  ]
}
```

### 5. Repository/Webhook Filtering

Filter which events trigger the workflow:

```json
{
  "filters": [
    {
      "field": "lifecycle_stage",
      "operator": "equals",
      "value": "lead"
    }
  ]
}
```

## Testing Advanced Blueprints

### Running Automated Tests

```typescript
import { validateDsl } from '@automation-blueprints/dsl';
import blueprint from './lead-to-contract-automation.json';

// 1. Validate blueprint structure
const validation = validateDsl(blueprint);
if (!validation.ok) {
  throw new Error(`Invalid blueprint: ${validation.errors}`);
}

// 2. Run test cases
blueprint.tests.forEach(test => {
  console.log(`Running test: ${test.name}`);
  
  // Simulate with fixtures
  const payload = eval(test.input); // Use fixtures.trigger
  
  test.expectations.forEach(expect => {
    // Verify step would receive correct input
    console.log(`Expecting ${expect.step}.${expect.field} = ${expect.value}`);
  });
});
```

### Integration Testing

Use the API sandbox to test end-to-end:

```bash
# Deploy to sandbox environment
curl -X POST http://localhost:3001/api/sandbox/deploy \
  -H "Content-Type: application/json" \
  -d @lead-to-contract-automation.json

# Trigger with test data
curl -X POST http://localhost:3001/api/sandbox/trigger \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

## Error Handling

Advanced blueprints should handle errors gracefully:

```json
{
  "steps": [
    {
      "id": "api-call",
      "app": "external-api",
      "action": "fetch_data",
      "retry": {
        "maxAttempts": 3,
        "backoff": "exponential"
      },
      "onError": {
        "action": "notify",
        "channel": "#alerts",
        "message": "API call failed: {{error.message}}"
      }
    }
  ]
}
```

## Production Deployment Checklist

Before deploying advanced blueprints to production:

- [ ] All tests pass
- [ ] DSL validation succeeds
- [ ] Fixtures cover edge cases
- [ ] Conditional logic verified
- [ ] Error handling configured
- [ ] Platform compatibility confirmed
- [ ] Secrets/credentials configured
- [ ] Rate limits considered
- [ ] Monitoring/alerts set up

## Platform Exports

See how these blueprints translate to different platforms:
- [Zapier exports](../exports/zapier/)
- [Make exports](../exports/make/)
- [n8n exports](../exports/n8n/)
- [Power Automate exports](../exports/power-automate/)

## Further Reading

- [DSL Schema Documentation](../../../packages/dsl/README.md)
- [Adapter Documentation](../../../packages/adapters/README.md)
- [API Integration Examples](../api/README.md)
- [SDK Usage Examples](../../sdk-usage/README.md)
