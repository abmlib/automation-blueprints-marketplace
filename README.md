# Automation Blueprints Marketplace — Open Source SDK

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/abmlib/automation-blueprints-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/abmlib/automation-blueprints-marketplace/actions/workflows/ci.yml)

Open-source SDK packages and community blueprint examples for the [Automation Blueprints Marketplace](https://abmlib.dev).

## What Is This Repository?

This is the **open-source community hub** of the Automation Blueprints ecosystem. It contains:

- **`@automation-blueprints/dsl`** — JSON Schema validator for automation blueprint definitions
- **`@automation-blueprints/adapters`** — Platform export adapters (Zapier, Make, n8n, Power Automate)
- **Blueprint examples** — Ready-to-use automation templates at varying complexity levels
- **DSL documentation** — Schema specification, versioning policy, migration guides

The full marketplace platform at [abmlib.dev](https://abmlib.dev) provides browsing, publishing, sandbox testing, and direct deployment of blueprints.

## Quick Start

### Install

```bash
npm install @automation-blueprints/dsl @automation-blueprints/adapters
```

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
| [@automation-blueprints/dsl](./packages/dsl) | Blueprint validation & JSON Schema (Draft-07) |
| [@automation-blueprints/adapters](./packages/adapters) | Export adapters for Zapier, Make, n8n, Power Automate |

## Blueprint Examples

| Level | Directory | Description |
|-------|-----------|-------------|
| Basic | [examples/blueprints/basic](./examples/blueprints/basic) | Single-step workflows for beginners |
| Intermediate | [examples/blueprints/intermediate](./examples/blueprints/intermediate) | Multi-step workflows with transforms |
| Advanced | [examples/blueprints/advanced](./examples/blueprints/advanced) | Complex conditional logic and orchestration |
| Platform Exports | [examples/blueprints/exports](./examples/blueprints/exports) | Same blueprint exported to Zapier, Make, n8n, Power Automate |

## Documentation

- [DSL Schema Reference](./packages/dsl/README.md)
- [Adapters Reference](./packages/adapters/README.md)
- [Breaking Change Policy](./docs/dsl/breaking-change-policy.md)
- [Migration Guide](./docs/dsl/migration-guide.md)
- [Platform API Documentation](https://abmlib.dev/docs/schema)

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

- Node.js >= 18.0.0
- npm >= 9.0.0

## License

**SDK & Tools**: [Apache License 2.0](./LICENSE)
**Blueprints**: See [Blueprint Contributor Agreement](./BLUEPRINT_CONTRIBUTOR_AGREEMENT.md)

## Links

- [Marketplace Platform](https://abmlib.dev)
- [Documentation](https://abmlib.dev/docs/schema)
- [Discussions](https://github.com/abmlib/automation-blueprints-marketplace/discussions)
- [Report a Bug](https://github.com/abmlib/automation-blueprints-marketplace/issues/new?template=bug_report.yml)
- [Request a Feature](https://github.com/abmlib/automation-blueprints-marketplace/issues/new?template=feature_request.yml)
