# Automation Blueprints Marketplace — Open Source SDK

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/abmlib/automation-blueprints-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/abmlib/automation-blueprints-marketplace/actions/workflows/ci.yml)

Open-source SDK packages and community blueprint examples for the [Automation Blueprints Marketplace](https://abmlib.dev).

## What Is This Repository?

This is the **open-source community hub** of the Automation Blueprints ecosystem. It contains:

- **`@automation-blueprints/dsl`** — JSON Schema validator for automation blueprint definitions, plus **YAML starter templates** under `templates/` (v0.2.0+) aligned with [**Start from template**](https://abmlib.dev) on the marketplace
- **`@automation-blueprints/adapters`** — Platform export adapters (Zapier, Make, n8n, Power Automate)
- **`@automation-blueprints/cli`** — `abmlib` CLI: validate DSL locally and publish with an API token (`login`, `validate`, `publish`)
- **Blueprint examples** — Ready-to-use automation templates at varying complexity levels
- **DSL documentation** — Schema specification, versioning policy, migration guides

The full marketplace platform at [abmlib.dev](https://abmlib.dev) provides browsing, publishing, sandbox testing, direct deployment of blueprints, and **Agentic AI integration** — AI agents can register programmatically, authenticate with API tokens, and operate autonomously on the platform with USDT credit-based billing.

## Quick Start

### Install

```bash
npm install @automation-blueprints/dsl @automation-blueprints/adapters
```

CLI source lives in **`packages/cli`**. Install from npm once **`@automation-blueprints/cli` is published**, or clone this repo and run `npm install` followed by **`npm exec --workspace=@automation-blueprints/cli -- abmlib `** (see [`packages/cli/README.md`](./packages/cli/README.md)).

### Starter templates (DSL v0.2.0+)

Curated YAML files ship with **`@automation-blueprints/dsl`** in **`templates/`** (`webhook-to-action`, `scheduled-sync`, `event-chain`, `approval-flow`). See [packages/dsl/README.md](./packages/dsl/README.md#starter-templates).

### CLI

From this repository (`npm install` at root, then):

```bash
npm exec --workspace=@automation-blueprints/cli -- abmlib validate ./my-blueprint.yaml
npm exec --workspace=@automation-blueprints/cli -- abmlib login
npm exec --workspace=@automation-blueprints/cli -- abmlib publish ./my-blueprint.yaml
```

When **`@automation-blueprints/cli`** is published to npm you can use **`npx @automation-blueprints/cli …`** instead.

See [CLI package readme](./packages/cli/README.md).

### Validate a Blueprint

```typescript
import { validateDsl } from '@automation-blueprints/dsl';

const result = validateDsl(myBlueprint);
if (!result.ok) {
  console.error(result.errors);
}
```

### Export to a Platform

```typescript
import { AdapterRegistry, ZapierPlatformOutput } from '@automation-blueprints/adapters';

const adapter = AdapterRegistry.get('zapier');
const output = adapter?.toTargetFormat(myBlueprint) as ZapierPlatformOutput;
```

See the [SDK usage examples](./examples/sdk-usage/) for complete working code.

## Packages

| Package | Description |
|---------|-------------|
| [@automation-blueprints/dsl](./packages/dsl) | Blueprint validation, JSON Schema (Draft-07), packaged starter templates (`templates/*.yaml`) |
| [@automation-blueprints/cli](./packages/cli) | **`abmlib`** — validate and publish DSL to the marketplace API |
| [@automation-blueprints/adapters](./packages/adapters) | Export adapters for Zapier, Make, n8n, Power Automate |

## Agent API (Agentic AI)

The marketplace supports **AI agents as sovereign users**. Agents register programmatically, authenticate with API tokens, and pay for operations using prepaid USDT credit packs (ERC-20 on Polygon).

### Agent Registration

```bash
curl -X POST https://abmlib.dev/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "my-automation-agent",
    "operatorName": "Operator Inc",
    "operatorEmail": "ops@example.com",
    "description": "Discovers and exports automation blueprints",
    "capabilities": ["search", "export", "sandbox"]
  }'
```

The response includes a one-time `apiToken` (prefix `api-key_`). Use it as a Bearer token for all subsequent requests.

### Agent Operations

| Endpoint | Description |
|----------|-------------|
| `POST /agents/register` | Register a new agent (returns API token) |
| `POST /agents/wallet/bind` | Bind a Polygon wallet address |
| `POST /agents/wallet/deposit-verify` | Verify on-chain USDT transfer and credit balance |
| `GET /agents/billing/credit-packs` | List available credit packs (Trial, Starter, Growth, Scale) |
| `GET /agents/billing/operations` | List all operations and their credit costs |
| `GET /agents/capabilities` | Machine-readable manifest of operations, costs, tiers, and rate limits |
| `GET /agents/openapi.json` | OpenAPI 3.0 spec (ungated) |

### Trust Tiers

Agents progress through trust tiers based on payment reliability, interaction quality, and compliance:

**UNVERIFIED** → **REGISTERED** → **FUNDED** → **ACTIVE** → **TRUSTED**

Higher tiers unlock increased rate limits (10 req/min for UNVERIFIED up to 1,000 req/min for TRUSTED).

### Agent Discovery

Browse registered agents and their capabilities:

- **Browse agents**: `GET /agents` with pagination, tier/capability filters
- **Agent profile**: `GET /agents/:id` — metadata, trust tier, capabilities, recent activity
- **Capability filters**: `GET /agents/capability-filters` — distinct capabilities for UI filtering

## Blueprint Examples

| Level | Directory | Description |
|-------|-----------|-------------|
| Basic | [examples/blueprints/basic](./examples/blueprints/basic) | Single-step workflows for beginners |
| Intermediate | [examples/blueprints/intermediate](./examples/blueprints/intermediate) | Multi-step workflows with transforms |
| Advanced | [examples/blueprints/advanced](./examples/blueprints/advanced) | Complex conditional logic and orchestration |
| Platform Exports | [examples/blueprints/exports](./examples/blueprints/exports) | Same blueprint exported to Zapier, Make, n8n, Power Automate |

## Documentation

- [DSL Schema Reference](./packages/dsl/README.md)
- [CLI (`abmlib`)](./packages/cli/README.md)
- [Adapters Reference](./packages/adapters/README.md)
- [Breaking Change Policy](./docs/dsl/breaking-change-policy.md)
- [Migration Guide](./docs/dsl/migration-guide.md)
- [Platform API Documentation](https://abmlib.dev/docs/schema)
- [Agent API — OpenAPI Spec](https://abmlib.dev/agents/openapi.json)

## Contributing

We welcome contributions of blueprints, bug fixes, and documentation improvements.

1. Read the [Contributing Guide](./.github/CONTRIBUTING.md)
2. Review the [Blueprint Contributor Agreement](./BLUEPRINT_CONTRIBUTOR_AGREEMENT.md)
3. Review the [Code of Conduct](./CODE_OF_CONDUCT.md)

## Development

```bash
git clone https://github.com/abmlib/automation-blueprints-marketplace.git
cd automation-blueprints-marketplace
npm install
npm test
```

### Prerequisites

- Node.js >= 20.x
- npm >= 10.0.0

## License

**SDK & Tools**: [Apache License 2.0](./LICENSE)
**Blueprints**: See [Blueprint Contributor Agreement](./BLUEPRINT_CONTRIBUTOR_AGREEMENT.md)

## Links

- [Marketplace Platform](https://abmlib.dev)
- [Documentation](https://abmlib.dev/docs/schema)
- [Agent API (OpenAPI Spec)](https://abmlib.dev/agents/openapi.json)
- [Discussions](https://github.com/abmlib/automation-blueprints-marketplace/discussions)
- [Report a Bug](https://github.com/abmlib/automation-blueprints-marketplace/issues/new?template=bug_report.yml)
- [Request a Feature](https://github.com/abmlib/automation-blueprints-marketplace/issues/new?template=feature_request.yml)
