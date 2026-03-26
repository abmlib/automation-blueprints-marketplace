# Contributing to Automation Blueprints Marketplace

Thank you for your interest in contributing to the Automation Blueprints open-source project.

## Business Model Disclosure

This repository contains the **open-source SDK and community blueprints** for the [Automation Blueprints Marketplace](https://abmlib.dev). The marketplace platform itself is a commercial product. Contributed blueprints may be used commercially as described in the [Blueprint Contributor Agreement](../BLUEPRINT_CONTRIBUTOR_AGREEMENT.md). Contributors receive attribution and community recognition, not financial compensation.

## Ways to Contribute

### 1. Submit a Blueprint

Blueprints are JSON files conforming to the [DSL Schema v0.1](../packages/dsl/README.md).

**Requirements:**
- Must pass validation via `validateDsl()` from `@automation-blueprints/dsl`
- Must include all required fields: `id`, `name`, `version`, `apps`, `trigger`, `steps`
- Must not contain hardcoded API keys, secrets, or personally identifiable information
- Should include meaningful step IDs and descriptive names

**Process:**
1. Fork this repository
2. Create your blueprint JSON file in the appropriate `examples/blueprints/` subdirectory:
   - `basic/` — Single-step, simple workflows
   - `intermediate/` — Multi-step workflows with transforms
   - `advanced/` — Complex logic with conditions and orchestration
3. Add a brief description in the directory's `README.md`
4. Open a pull request

### 2. Improve the SDK Packages

Contributions to `@automation-blueprints/dsl` and `@automation-blueprints/adapters` are welcome.

**Development setup:**
```bash
git clone https://github.com/abmlib/automation-blueprints-marketplace.git
cd automation-blueprints-marketplace
npm install
npm test
```

**Guidelines:**
- All changes must include tests
- Tests must pass: `npm test`
- Build must succeed: `npm run build`
- Follow the existing code style and TypeScript conventions

### 3. Improve Documentation

Documentation fixes, clarifications, and additions are always appreciated. This includes:
- Package READMEs
- DSL documentation in `docs/dsl/`
- Example READMEs
- Inline code documentation

### 4. Report Issues

Use the [issue templates](https://github.com/abmlib/automation-blueprints-marketplace/issues/new/choose) to report bugs or request features.

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Make your changes following the guidelines above
3. Ensure all tests pass
4. Fill out the pull request template completely
5. Wait for review — maintainers will respond within 5 business days

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](../CODE_OF_CONDUCT.md). In summary: be respectful, constructive, and inclusive.

## Legal

By submitting a pull request, you agree to the terms of the [Blueprint Contributor Agreement](../BLUEPRINT_CONTRIBUTOR_AGREEMENT.md). This includes granting a perpetual, royalty-free license for ABM to use your contribution commercially.

## Questions?

- Open a [Discussion](https://github.com/abmlib/automation-blueprints-marketplace/discussions)
- Email: legal@abmlib.dev (for legal questions about the contributor agreement)
- Email: security@abmlib.dev (for security vulnerabilities — do **not** open a public issue)
