/**
 * Example: Validating Automation Blueprints
 * 
 * This example demonstrates how to use @automation-blueprints/dsl
 * to validate blueprint configurations.
 */

import { validateDsl, dslSchema } from '@automation-blueprints/dsl';

// Example 1: Valid Blueprint
console.log('=== Example 1: Valid Blueprint ===\n');

const validBlueprint = {
  id: 'bp-slack-crm-sync',
  name: 'Slack to CRM Sync',
  version: '1.0.0',
  apps: ['slack', 'salesforce'],
  scopes: ['messaging', 'crm'],
  trigger: {
    app: 'slack',
    event: 'message_posted',
    filters: [
      {
        field: 'channel',
        operator: 'equals',
        value: '#sales'
      }
    ]
  },
  retry: {
    attempts: 3,
    delayMs: 1000
  },
  steps: [
    {
      id: 'parse-message',
      app: 'tools',
      action: 'extract_data',
      inputs: {
        pattern: /\w+/
      }
    },
    {
      id: 'create-lead',
      app: 'salesforce',
      action: 'create_record',
      inputs: {
        object: 'Lead',
        fields: {}
      },
      transforms: [
        {
          field: 'email',
          operation: 'lowercase'
        }
      ]
    }
  ],
  tests: [
    {
      name: 'Test valid message',
      input: {
        channel: '#sales',
        text: 'New lead: john@example.com'
      },
      expectations: []
    }
  ]
};

const result1 = validateDsl(validBlueprint);

if (result1.ok) {
  console.log('✓ Blueprint is valid!');
  console.log(`  Name: ${validBlueprint.name}`);
  console.log(`  Version: ${validBlueprint.version}`);
  console.log(`  Apps: ${validBlueprint.apps.join(', ')}`);
  console.log(`  Steps: ${validBlueprint.steps.length}\n`);
} else {
  console.error('✗ Validation failed:', result1.errors);
}

// Example 2: Invalid Blueprint (Missing Required Fields)
console.log('=== Example 2: Invalid Blueprint - Missing Fields ===\n');

const invalidBlueprint1 = {
  id: 'bp-invalid',
  name: 'Invalid Blueprint',
  // Missing: version, apps, trigger, steps
};

const result2 = validateDsl(invalidBlueprint1);

if (!result2.ok) {
  console.log('✗ Validation failed as expected:');
  result2.errors?.forEach(err => console.log(`  - ${err}`));
  console.log();
}

// Example 3: Invalid Blueprint (Wrong Data Types)
console.log('=== Example 3: Invalid Blueprint - Wrong Types ===\n');

const invalidBlueprint2 = {
  id: 'bp-wrong-types',
  name: 'BP',  // Too short (min 3 chars)
  version: '1.0',  // Wrong format (should be semver)
  apps: [],  // Empty array (min 1 item)
  trigger: {
    app: 'slack'
    // Missing: event
  },
  steps: []  // Empty array (min 1 item)
};

const result3 = validateDsl(invalidBlueprint2);

if (!result3.ok) {
  console.log('✗ Validation failed as expected:');
  result3.errors?.forEach(err => console.log(`  - ${err}`));
  console.log();
}

// Example 4: Invalid Blueprint (Malformed retry config)
console.log('=== Example 4: Invalid Blueprint - Malformed Retry ===\n');

const invalidBlueprint3 = {
  id: 'bp-bad-retry',
  name: 'Blueprint with Bad Retry',
  version: '1.0.0',
  apps: ['slack'],
  trigger: { app: 'slack', event: 'message' },
  retry: {
    attempts: 3
    // Missing: delayMs (required when retry object is present)
  },
  steps: [
    { id: 's1', app: 'slack', action: 'send' }
  ]
};

const result4 = validateDsl(invalidBlueprint3);

if (!result4.ok) {
  console.log('✗ Validation failed as expected:');
  result4.errors?.forEach(err => console.log(`  - ${err}`));
  console.log();
}

// Example 5: Accessing the Schema
console.log('=== Example 5: Accessing the Schema ===\n');

console.log('Schema ID:', dslSchema.$id);
console.log('Schema Title:', dslSchema.title);
console.log('Required Fields:', dslSchema.required);
console.log();

// Example 6: Programmatic Validation in Application
console.log('=== Example 6: Validation in Application ===\n');

function publishBlueprint(blueprint: unknown): boolean {
  const validation = validateDsl(blueprint);
  
  if (!validation.ok) {
    console.error('Cannot publish: Blueprint has validation errors');
    validation.errors?.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`);
    });
    return false;
  }
  
  console.log('✓ Blueprint validated successfully');
  console.log('  Publishing to marketplace...');
  // ... actual publish logic
  return true;
}

// Test with valid blueprint
publishBlueprint(validBlueprint);
console.log();

// Test with invalid blueprint
publishBlueprint({ id: 'invalid' });
