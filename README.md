# Automation Blueprints Marketplace - Open Source Tools

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://badge.fury.io/js/%40automation-blueprints%2Fdsl.svg)](https://www.npmjs.com/package/@automation-blueprints/dsl)

Open-source SDK and community blueprints for the [Automation Blueprints Marketplace](https://abmlib.dev).

## 🎯 What's This Repository?

This is the **open-source foundation** of the Automation Blueprints ecosystem:

- **Free Tools**: Validate and export blueprints locally
- **Community Library**: Browse 100+ automation templates
- **Platform Agnostic**: Export to Zapier, Make, n8n, Power Automate

The **full marketplace platform** at [https://abmlib.dev] offers:
- 🏢 Enterprise subscriptions (private catalogs, governance, SSO)
- 📊 Analytics & trend reports
- ✅ Advanced compliance validation
- 🚀 Priority support & SLAs

## 🚀 Quick Start

### Install SDKs
\`\`\`bash
npm install @automation-blueprints/dsl @automation-blueprints/adapters
\`\`\`

### Validate a Blueprint
\`\`\`typescript
import { validateDsl } from '@automation-blueprints/dsl';

const result = validateDsl(myBlueprint);
if (!result.ok) {
  console.error(result.errors);
}
\`\`\`

### Export to Platform
\`\`\`typescript
import { AdapterRegistry } from '@automation-blueprints/adapters';

const adapter = AdapterRegistry.get('zapier');
const config = adapter.toTargetFormat(myBlueprint);
\`\`\`

## 🤝 Contributing Blueprints

We welcome community contributions! 

**Before contributing:**
1. Read [Blueprint Contributor Agreement](./BLUEPRINT_CONTRIBUTOR_AGREEMENT.md)
2. Review [Contributing Guidelines](./.github/CONTRIBUTING.md)
3. Check [Quality Standards](./docs/contributing/quality-standards.md)

**Benefits of contributing:**
- 🌟 Build your portfolio
- 🏆 Community recognition
- 📈 Help thousands of businesses automate

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@automation-blueprints/dsl](./packages/dsl) | ![npm](https://img.shields.io/npm/v/@automation-blueprints/dsl) | Blueprint validation & schema |
| [@automation-blueprints/adapters](./packages/adapters) | ![npm](https://img.shields.io/npm/v/@automation-blueprints/adapters) | Platform export adapters |

## 🌐 Marketplace Platform

Visit [https://abmlib.dev] for:

**Free Tier:**
- Browse all community blueprints
- 10 exports/month
- Basic validation
- Community support

**Enterprise:**
- Private blueprint catalogs
- Unlimited exports
- Advanced compliance validation (HIPAA, GDPR, SOC2)
- Usage analytics & insights
- Priority support with SLA
- SSO & team management

[View Pricing](https://your-domain.com/pricing)

## 📖 Documentation

- [DSL Schema](https://your-domain.com/docs/schema)
- [SDK Reference](https://your-domain.com/docs/sdk)
- [API Documentation](./docs/api/openapi.yaml)
- [Platform Adapters](./docs/adapters/)

## 📄 License

**SDK & Tools**: Apache License 2.0  
**Blueprints**: See [Blueprint Contributor Agreement](./BLUEPRINT_CONTRIBUTOR_AGREEMENT.md)

## 🔗 Links

- [Marketplace](https://abmlib.dev)
- [Documentation](https://abmlib.dev/docs/schema)
- [Community](https://abmlib.dev/community)
- [Enterprise](https://abmlib.dev/enterprise)
