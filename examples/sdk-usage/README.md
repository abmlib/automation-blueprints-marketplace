# SDK Usage Examples

This directory contains comprehensive examples demonstrating how to use the Automation Blueprints SDK packages.

## Prerequisites

Install the required packages:

```bash
npm install @automation-blueprints/dsl @automation-blueprints/adapters
```

Or if using from the monorepo:

```bash
cd packages/dsl && npm run build
cd ../adapters && npm run build
```

## Examples

### 1. Blueprint Validation (`validate-blueprint.ts`)

Demonstrates comprehensive usage of the `@automation-blueprints/dsl` package:

- Validating a complete, valid blueprint
- Handling validation errors for missing required fields
- Catching type validation errors
- Working with optional fields (retry configuration)
- Accessing the JSON Schema directly
- Integrating validation into application logic

**Run the example:**

```bash
npx ts-node validate-blueprint.ts
```

**Key Concepts:**
- Using `validateDsl()` function
- Interpreting `ValidationResult` objects
- Error message formatting
- Schema introspection with `dslSchema`

### 2. Platform Conversion (`convert-to-platforms.ts`)

Demonstrates comprehensive usage of the `@automation-blueprints/adapters` package:

- Listing all available platform adapters
- Converting blueprints to Zapier format
- Converting blueprints to Make (Integromat) format
- Converting blueprints to n8n format
- Converting blueprints to Power Automate format
- Batch conversion to all platforms
- Selective export based on user preference
- Error handling for unknown platforms

**Run the example:**

```bash
npx ts-node convert-to-platforms.ts
```

**Key Concepts:**
- Using `AdapterRegistry.list()` to discover adapters
- Using `AdapterRegistry.get()` to retrieve adapters
- Calling `toTargetFormat()` for conversion
- Optional `canHandle()` checks
- Error handling and validation

## Common Patterns

### Pattern 1: Validate Then Export

```typescript
import { validateDsl } from '@automation-blueprints/dsl';
import { AdapterRegistry } from '@automation-blueprints/adapters';

function validateAndExport(blueprint: unknown, platform: string) {
  // Step 1: Validate
  const validation = validateDsl(blueprint);
  if (!validation.ok) {
    console.error('Validation errors:', validation.errors);
    return null;
  }
  
  // Step 2: Export
  const adapter = AdapterRegistry.get(platform);
  if (!adapter) {
    console.error(`Platform ${platform} not found`);
    return null;
  }
  
  return adapter.toTargetFormat(blueprint);
}
```

### Pattern 2: Multi-Platform Export with Validation

```typescript
import { validateDsl } from '@automation-blueprints/dsl';
import { AdapterRegistry } from '@automation-blueprints/adapters';

function exportToMultiplePlatforms(blueprint: unknown, platforms: string[]) {
  // Validate once
  const validation = validateDsl(blueprint);
  if (!validation.ok) {
    throw new Error(`Invalid blueprint: ${validation.errors?.join(', ')}`);
  }
  
  // Export to each platform
  const results: Record<string, any> = {};
  for (const platform of platforms) {
    const adapter = AdapterRegistry.get(platform);
    if (adapter) {
      results[platform] = adapter.toTargetFormat(blueprint);
    }
  }
  
  return results;
}

// Usage
const exports = exportToMultiplePlatforms(myBlueprint, ['zapier', 'n8n', 'make']);
```

### Pattern 3: Safe Export with Type Checking

```typescript
import { validateDsl, ValidationResult } from '@automation-blueprints/dsl';
import { Adapter, AdapterRegistry } from '@automation-blueprints/adapters';

function safeExport(
  blueprint: unknown,
  platform: string
): { success: boolean; data?: any; errors?: string[] } {
  // Validate
  const validation: ValidationResult = validateDsl(blueprint);
  if (!validation.ok) {
    return { success: false, errors: validation.errors };
  }
  
  // Get adapter
  const adapter: Adapter | undefined = AdapterRegistry.get(platform);
  if (!adapter) {
    return { 
      success: false, 
      errors: [`Platform '${platform}' not supported`] 
    };
  }
  
  // Optional: Check if adapter can handle
  if (adapter.canHandle && !adapter.canHandle(blueprint)) {
    return { 
      success: false, 
      errors: ['Adapter cannot handle this blueprint'] 
    };
  }
  
  // Export
  try {
    const data = adapter.toTargetFormat(blueprint);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      errors: [`Export failed: ${error.message}`] 
    };
  }
}
```

## TypeScript Support

All examples are fully typed. When using TypeScript, you'll get:

- IntelliSense for all exported functions and classes
- Type checking for method parameters
- Auto-completion for adapter runtime names
- Compile-time error detection

## Further Reading

- [`@automation-blueprints/dsl` README](../../packages/dsl/README.md)
- [`@automation-blueprints/adapters` README](../../packages/adapters/README.md)
- [Blueprint DSL Schema](../../packages/dsl/src/schema.json)

## Need Help?

If you encounter issues or have questions about using the SDK:

1. Check the package README files for detailed API documentation
2. Review these examples for usage patterns
3. Inspect the TypeScript definitions for method signatures
4. Run the test suites in each package for more examples

## Contributing

Found a bug or want to add a new example? Contributions are welcome!
