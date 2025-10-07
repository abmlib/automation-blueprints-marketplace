# DSL Migration Guide

**Document Status:** `[ACTIVE]`  
**Last Updated:** 2025-10-07

---

## Current Version: v0.1

This document provides migration guidance for upgrading between versions of the Automation Blueprint DSL.

---

## Migration Paths

### Future: v0.1 → v0.2 (Planned)

*No migrations required yet. This section will be populated when v0.2 is released.*

---

## Version Compatibility

| DSL Version | Adapters Version | API Version | Status |
|-------------|------------------|-------------|--------|
| v0.1        | 0.1.0           | v1          | Current |

---

## Migration Template (For Future Use)

When a new version is released, migrations will follow this format:

### Migrating from vX.Y to vX.Z

**Release Date:** YYYY-MM-DD  
**Breaking Changes:** Yes/No

#### Overview
Brief description of what changed and why.

#### Required Changes

1. **Change Name**
   
   **Before (vX.Y):**
   ```json
   {
     "oldField": "value"
   }
   ```
   
   **After (vX.Z):**
   ```json
   {
     "newField": "value"
   }
   ```
   
   **Migration Steps:**
   - Step 1: ...
   - Step 2: ...

2. **Another Change**
   
   [Similar structure]

#### Automated Migration

If automated migration tools are available:

```bash
# Example command (will be provided when available)
npx @automation-blueprints/migrate --from 0.1 --to 0.2 ./blueprints/
```

#### Testing Your Migration

1. Validate your migrated blueprints:
   ```bash
   npx @automation-blueprints/dsl validate ./blueprints/
   ```

2. Test in sandbox environment

3. Review adapter outputs

#### Need Help?

- Check the [CHANGELOG](../../packages/dsl/CHANGELOG.md)
- Review [Breaking Change Policy](./breaking-change-policy.md)
- Open an issue on GitHub

---

## Rollback Guidance

If you encounter issues after migration:

1. Revert to previous DSL version in your blueprints
2. Use previous adapter version: `npm install @automation-blueprints/adapters@0.1.0`
3. Report the issue on GitHub with details

---

## Best Practices

1. **Version Pin**: Pin DSL schema version in your blueprints (`"dslVersion": "0.1.0"`)
2. **Test Before Production**: Always test migrated blueprints in sandbox
3. **Gradual Migration**: Migrate blueprints incrementally, not all at once
4. **Keep Backups**: Maintain backups of blueprints before migration
5. **Review Changelogs**: Read CHANGELOG before upgrading

---

## Historical Migrations

### v0.1 (Initial Release)

No migrations required. This is the first version.

---

*This guide will be updated with each new DSL version release.*
