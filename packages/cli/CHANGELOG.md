# Changelog

All notable changes to `@automation-blueprints/cli` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

### Added

- Open-source **`abmlib`** CLI (`login`, `validate`, `publish`) for validating DSL locally and publishing blueprints via the [abmlib.dev](https://abmlib.dev) API with an API token.
- Depends on **`@automation-blueprints/dsl`** for local validation prior to publish.
- Automated tests for command flows (`jest`).
