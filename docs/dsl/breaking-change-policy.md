# Breaking Change Policy

**Document Status:** `[ACTIVE]`  
**Last Updated:** 2025-10-07  
**Applies to:** DSL Schema, Adapters Package, API

---

## 1. Purpose

This document establishes the policy for managing breaking changes across the Automation Blueprints platform, ensuring users have clear expectations and migration paths when the platform evolves.

---

## 2. Semantic Versioning

All components follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version (e.g., 1.0.0 → 2.0.0): Breaking changes
- **MINOR** version (e.g., 1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** version (e.g., 1.0.0 → 1.0.1): Bug fixes, backward compatible

### Current Versions
- **DSL Schema**: `v0.1` (pre-release)
- **Adapters Package**: `0.1.0` (pre-release)
- **API**: `v1` (stable)

---

## 3. What Constitutes a Breaking Change

### 3.1. DSL Schema (`packages/dsl`)

A change is **breaking** if it:
- Removes or renames existing required fields
- Changes field types incompatibly (e.g., string → number)
- Adds new required fields without defaults
- Changes validation rules to be more restrictive
- Removes supported operators or transformations

A change is **NOT breaking** if it:
- Adds optional fields
- Adds new supported values to enums
- Relaxes validation rules
- Adds new optional operators or transformations
- Fixes bugs that make the schema more permissive

### 3.2. Adapters Package (`packages/adapters`)

A change is **breaking** if it:
- Changes the `adapt()` function signature
- Removes support for previously supported DSL features
- Changes output format incompatibly
- Removes or renames exported functions/classes

A change is **NOT breaking** if it:
- Adds support for new DSL features
- Improves output quality while maintaining format
- Adds new optional parameters with defaults
- Adds new exported utilities

### 3.3. API (`apps/api`)

A change is **breaking** if it:
- Removes or renames endpoints
- Changes required request parameters
- Changes response structure incompatibly
- Removes support for previously accepted values
- Changes authentication/authorization requirements

A change is **NOT breaking** if it:
- Adds new endpoints
- Adds optional parameters
- Adds new fields to responses
- Adds new accepted values
- Improves error messages

---

## 4. Deprecation Process

Before introducing a breaking change, we follow this process:

### 4.1. Deprecation Notice (MAJOR.MINOR release)

1. Mark the feature as deprecated in code comments and documentation
2. Update CHANGELOG with deprecation notice
3. Add warnings in runtime (where applicable)
4. Document the migration path
5. Maintain backward compatibility

**Minimum deprecation period:** 3 months OR 2 MINOR versions, whichever is longer

### 4.2. Breaking Change (MAJOR release)

1. Increment MAJOR version
2. Remove deprecated feature
3. Update CHANGELOG with clear before/after examples
4. Publish migration guide
5. Update all examples and documentation

---

## 5. Migration Support

For each breaking change, we provide:

1. **Migration Guide** (`docs/dsl/migration-guide.md`)
   - Clear before/after code examples
   - Step-by-step migration instructions
   - Automated migration tools (when feasible)

2. **Changelog Entry**
   - Detailed description of the change
   - Rationale for the change
   - Link to migration guide

3. **Version Compatibility Matrix**
   - Which DSL versions work with which adapter versions
   - Which API versions are currently supported

---

## 6. API Versioning Strategy

### 6.1. URL Versioning

The API uses URL path versioning: `/api/v{MAJOR}/`

- Current: `/api/v1/blueprints`
- Future: `/api/v2/blueprints` (if breaking changes needed)

### 6.2. Version Support Policy

- **Current version (v1)**: Fully supported, receives all updates
- **Previous version (v0)**: Deprecated, security fixes only, 6-month sunset period
- **Older versions**: Not supported

### 6.3. Sunset Process

1. Announce deprecation 6 months before sunset
2. Add deprecation headers to responses: `Sunset: <date>`
3. Provide migration guide to current version
4. Remove version after sunset date

---

## 7. Pre-1.0 Exceptions

While in `0.x` versions (pre-release):

- Breaking changes MAY occur in MINOR versions
- Each MINOR version increment SHOULD document breaking changes
- Migration guides SHOULD be provided for significant changes
- API versioning is still enforced (`/api/v1/`)

**Commitment**: Once we reach `1.0.0`, we will strictly follow this policy.

---

## 8. Communication Channels

Breaking changes and deprecations will be announced via:

1. **CHANGELOG.md** in affected package
2. **Migration Guide** in `docs/dsl/`
3. **API Documentation** (Swagger/OpenAPI)
4. **Release Notes** in GitHub releases
5. **In-product notifications** (for API deprecations)

---

## 9. Emergency Breaking Changes

In cases of critical security vulnerabilities:

1. Breaking change MAY be deployed immediately
2. Deprecation period MAY be shortened to 30 days
3. Clear security advisory MUST be published
4. Migration guide MUST be provided within 48 hours

---

## 10. Enforcement

- All pull requests introducing breaking changes MUST:
  - Update version numbers appropriately
  - Update CHANGELOG.md
  - Include migration guide (or update existing one)
  - Pass CI checks including backward compatibility tests (when available)

- Pull requests violating this policy will be rejected

---

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [API Versioning Best Practices](https://restfulapi.net/versioning/)
