# Changelog

All notable changes to the Automation Blueprint Adapters package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Current

### Added
- **Zapier Adapter**: Export blueprints to Zapier format
  - Maps DSL triggers to Zapier triggers
  - Converts DSL steps to Zapier actions
  - Handles basic field transformations
  
- **Make (Integromat) Adapter**: Export blueprints to Make scenarios
  - Maps DSL to Make scenario structure
  - Supports trigger and action modules
  - Handles routing and filtering logic
  - Supports data transformations and mappings
  
- **n8n Adapter**: Export blueprints to n8n workflows
  - Full DSL to n8n workflow conversion
  - Supports trigger nodes and action nodes
  - Handles conditional logic and branching
  - Includes position and UI metadata
  
- **Power Automate Adapter**: Export blueprints to Power Automate flows
  - Maps DSL to Power Automate flow definition
  - Supports triggers and actions
  - Handles expressions and dynamic content
  - Includes connection references

### Adapter API
- Common `adapt()` interface for all adapters
- Error handling for unsupported DSL features
- Validation of DSL input before conversion
- TypeScript types for all platform formats

## [Unreleased]

### Planned
- Enhanced error reporting with suggested fixes
- Platform-specific optimization hints
- Bidirectional conversion support (import from platforms)
- Additional platform adapters

---

## Breaking Change Policy

See [`docs/dsl/breaking-change-policy.md`](../../docs/dsl/breaking-change-policy.md) for our commitment to backward compatibility and migration support.
