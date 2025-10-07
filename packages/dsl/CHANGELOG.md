# Changelog

All notable changes to the Automation Blueprint DSL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Current

### Added
- Initial DSL schema v0.1 with core automation blueprint structure
- Support for trigger definitions with event filters
- Support for multi-step workflows with conditional execution
- Support for data transformations and output mapping
- Support for retry policies
- Support for test definitions and fixtures
- JSON Schema validation via Ajv

### Schema Structure
- `id`, `name`, `version`: Blueprint metadata
- `apps`: Required integration apps
- `scopes`: OAuth/permission scopes
- `trigger`: Event-based trigger configuration with filters
- `steps`: Sequential workflow steps with inputs/outputs/transforms
- `retry`: Retry policy configuration
- `policies`: Custom policy definitions
- `fixtures`: Test data fixtures
- `tests`: Test case definitions
- `compatibility`: Platform compatibility metadata

### Supported Field Types
- String patterns for IDs and versions
- Array structures for multi-item fields
- Object structures for complex configurations
- Conditional logic support

## [Unreleased]

### Planned
- Migration guide for future breaking changes
- Extended validation rules
- Enhanced transformation operators
- Nested workflow support

---

## Breaking Change Policy

See [`docs/dsl/breaking-change-policy.md`](../../docs/dsl/breaking-change-policy.md) for our commitment to backward compatibility and migration support.
