# Changelog

All notable changes to the Automation Blueprint Adapters package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-27

### Added

- **Typed DSL input interfaces**: `BlueprintDsl`, `BlueprintDslStep`, `BlueprintDslTrigger`, `BlueprintDslFilter`, `BlueprintDslTransform`, `BlueprintDslRetry`
- **Typed platform output interfaces**: `ZapierPlatformOutput`, `MakeScenarioOutput`, `N8nWorkflowOutput`, `PowerAutomateWorkflowOutput` (and supporting sub-interfaces)
- **`Adapter<TOutput>` generic type parameter**: Adapters are now generic over their output type
- **`canHandle(dsl)` method**: Optional pre-conversion validation on the `Adapter` interface, implemented on Make, n8n, and Power Automate adapters
- **`detectUnsupportedFeatures(dsl)` method**: Returns human-readable warnings for DSL features the adapter cannot translate
- **Condition parser** (`condition-parser.ts`): Parses DSL `step.condition` strings into platform-native conditional branching (IF/Switch nodes on n8n, router routes on Make, If actions on Power Automate)
- **Retry config mapping**: DSL-level `retry.attempts` and `retry.delayMs` mapped to native retry formats on all four platforms (n8n `retryOnFail`/`maxTries`/`waitBetweenTries`, Make `onerror` retry modules, Power Automate `retryPolicy`, Zapier `retry` on perform)
- **Trigger filter mapping**: `trigger.filters[]` mapped to Make `filter` modules with `conditions` array and Power Automate trigger `conditions` expressions
- **Step outputs mapping**: `step.outputs[]` mapped to Make `expect` entries and Power Automate action outputs
- **OAuth scope mapping**: `scopes[]` mapped to Zapier `authentication.oauth2Config.scope`
- **Power Automate export example**: New `examples/blueprints/exports/power-automate/` directory
- **Comprehensive test suites**: Per-adapter integration tests for Zapier, Make, n8n, and Power Automate (133+ test cases)

### Changed

- **Zapier adapter**: Steps now map to `creates` and `searches` (keyed by step ID) with full `inputFields`, `outputFields`, and `perform` configuration, replacing the flat actions array
- **Make adapter**: `step.transforms` converted to flat `mapper` object with proper value handling; trigger module uses `trigger.app` and `trigger.event` from DSL
- **n8n adapter**: Trigger type dynamically resolved from `trigger.app` instead of hardcoded `n8n-nodes-base.webhook`; full node connection wiring between steps
- **Power Automate adapter**: Proper `$schema` and `contentVersion` in output; actions use `runAfter` dependency chaining
- **`Adapter` interface**: Now includes `canHandle?` and `detectUnsupportedFeatures?` optional methods

## [0.1.0] - 2026-03-26

### Added

- **Zapier Adapter**: Export blueprints to Zapier Developer Platform app definition format
- **Make (Integromat) Adapter**: Export blueprints to Make scenario blueprint format
- **n8n Adapter**: Export blueprints to n8n workflow JSON format
- **Power Automate Adapter**: Export blueprints to Azure Logic Apps workflow definition format
- **`Adapter` interface**: Common `toTargetFormat(dsl)` contract for all adapters
- **`AdapterRegistry`**: Central registry with `register()`, `get()`, and `list()` static methods
- Auto-registration of all four built-in adapters on import

---

## Breaking Change Policy

See [`docs/dsl/breaking-change-policy.md`](../../docs/dsl/breaking-change-policy.md) for our commitment to backward compatibility and migration support.
