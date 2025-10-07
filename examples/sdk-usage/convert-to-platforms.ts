/**
 * Example: Converting Blueprints to Platform-Specific Formats
 * 
 * This example demonstrates how to use @automation-blueprints/adapters
 * to export blueprints to Zapier, Make, n8n, and Power Automate.
 */

import { AdapterRegistry } from '@automation-blueprints/adapters';

// Sample blueprint definition
const blueprint = {
  name: 'Customer Onboarding Workflow',
  version: '1.0.0',
  trigger: {
    app: 'webhook',
    event: 'customer_signup'
  },
  steps: [
    {
      id: 'send-welcome-email',
      app: 'sendgrid',
      action: 'send_email',
      inputs: {
        to: '{{trigger.email}}',
        subject: 'Welcome to Our Platform!',
        template: 'welcome-template'
      }
    },
    {
      id: 'create-crm-contact',
      app: 'salesforce',
      action: 'create_contact',
      inputs: {
        email: '{{trigger.email}}',
        firstName: '{{trigger.firstName}}',
        lastName: '{{trigger.lastName}}'
      },
      transforms: [
        {
          field: 'email',
          operation: 'lowercase'
        }
      ]
    },
    {
      id: 'notify-team',
      app: 'slack',
      action: 'post_message',
      inputs: {
        channel: '#customer-success',
        text: 'New customer signed up: {{trigger.email}}'
      }
    }
  ]
};

console.log('=== Converting Blueprint to Different Platforms ===\n');
console.log(`Blueprint: ${blueprint.name} v${blueprint.version}\n`);

// Example 1: List Available Platforms
console.log('=== Example 1: Available Platforms ===\n');

const availablePlatforms = AdapterRegistry.list();
console.log('Supported platforms:', availablePlatforms.join(', '));
console.log(`Total: ${availablePlatforms.length} platforms\n`);

// Example 2: Convert to Zapier
console.log('=== Example 2: Convert to Zapier ===\n');

const zapierAdapter = AdapterRegistry.get('zapier');
if (zapierAdapter) {
  console.log(`Runtime: ${zapierAdapter.runtime}`);
  const zapierConfig = zapierAdapter.toTargetFormat(blueprint);
  console.log('Zapier Config:');
  console.log(JSON.stringify(zapierConfig, null, 2));
  console.log();
}

// Example 3: Convert to Make (Integromat)
console.log('=== Example 3: Convert to Make (Integromat) ===\n');

const makeAdapter = AdapterRegistry.get('make');
if (makeAdapter) {
  console.log(`Runtime: ${makeAdapter.runtime}`);
  const makeScenario = makeAdapter.toTargetFormat(blueprint);
  console.log('Make Scenario:');
  console.log(JSON.stringify(makeScenario, null, 2));
  console.log();
}

// Example 4: Convert to n8n
console.log('=== Example 4: Convert to n8n ===\n');

const n8nAdapter = AdapterRegistry.get('n8n');
if (n8nAdapter) {
  console.log(`Runtime: ${n8nAdapter.runtime}`);
  const n8nWorkflow = n8nAdapter.toTargetFormat(blueprint);
  console.log('n8n Workflow:');
  console.log(JSON.stringify(n8nWorkflow, null, 2));
  console.log();
}

// Example 5: Convert to Power Automate
console.log('=== Example 5: Convert to Power Automate ===\n');

const powerAutomateAdapter = AdapterRegistry.get('power-automate');
if (powerAutomateAdapter) {
  console.log(`Runtime: ${powerAutomateAdapter.runtime}`);
  const paFlow = powerAutomateAdapter.toTargetFormat(blueprint);
  console.log('Power Automate Flow:');
  console.log(JSON.stringify(paFlow, null, 2));
  console.log();
}

// Example 6: Batch Conversion
console.log('=== Example 6: Batch Conversion to All Platforms ===\n');

function exportToAllPlatforms(bp: any): Record<string, any> {
  const exports: Record<string, any> = {};
  
  AdapterRegistry.list().forEach(platform => {
    const adapter = AdapterRegistry.get(platform);
    if (adapter) {
      exports[platform] = adapter.toTargetFormat(bp);
    }
  });
  
  return exports;
}

const allExports = exportToAllPlatforms(blueprint);
console.log('Exported to platforms:', Object.keys(allExports).join(', '));
console.log(`Total exports: ${Object.keys(allExports).length}\n`);

// Example 7: Selective Export Based on User Preference
console.log('=== Example 7: Export Based on User Preference ===\n');

function exportBlueprint(bp: any, targetPlatform: string): any {
  const adapter = AdapterRegistry.get(targetPlatform);
  
  if (!adapter) {
    console.error(`Error: Platform '${targetPlatform}' not supported`);
    console.log(`Available platforms: ${AdapterRegistry.list().join(', ')}`);
    return null;
  }
  
  console.log(`✓ Exporting to ${targetPlatform}...`);
  
  // Optional: Check if adapter can handle this blueprint
  if (adapter.canHandle && !adapter.canHandle(bp)) {
    console.error(`Error: Adapter cannot handle this blueprint`);
    return null;
  }
  
  const result = adapter.toTargetFormat(bp);
  console.log(`✓ Export complete`);
  return result;
}

// User wants to export to n8n
const userChoice = 'n8n';
const exported = exportBlueprint(blueprint, userChoice);
if (exported) {
  console.log(`\n${userChoice} workflow ready for import\n`);
}

// Example 8: Error Handling for Unknown Platform
console.log('=== Example 8: Error Handling ===\n');

const unknownPlatform = 'custom-platform';
const unknownAdapter = AdapterRegistry.get(unknownPlatform);

if (!unknownAdapter) {
  console.log(`✗ Platform '${unknownPlatform}' not found`);
  console.log(`  Did you mean one of these?`);
  AdapterRegistry.list().forEach(p => console.log(`    - ${p}`));
}
