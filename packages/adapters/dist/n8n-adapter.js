"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class N8nAdapter {
    constructor() {
        this.runtime = "n8n";
    }
    /**
     * Converts automation blueprint DSL to n8n workflow format.
     */
    toTargetFormat(dsl) {
        const trigger = dsl.trigger ?? {};
        const steps = dsl.steps ?? [];
        const nodes = [
            {
                parameters: {
                    path: `/${trigger.event ?? "webhook"}`,
                    responseMode: "onReceived",
                    options: {},
                },
                name: "Webhook",
                type: "n8n-nodes-base.webhook",
                typeVersion: 1,
                position: [250, 300],
                webhookId: trigger.event ?? "default",
            },
        ];
        const connections = {
            Webhook: {
                main: [steps.length > 0 ? [{ node: steps[0].id ?? "Step_0", type: "main", index: 0 }] : []],
            },
        };
        steps.forEach((step, index) => {
            const nodeName = step.id ?? `Step_${index}`;
            const parameters = { ...(step.inputs ?? {}) };
            if (step.transforms && Array.isArray(step.transforms)) {
                step.transforms.forEach((t) => {
                    if (t.field && t.operation) {
                        parameters[t.field] = `={{ $json[\"${t.field}\"].${t.operation}() }}`;
                    }
                });
            }
            nodes.push({
                parameters,
                name: nodeName,
                type: `n8n-nodes-base.${step.app ?? "set"}`,
                typeVersion: 1,
                position: [250 + (index + 1) * 200, 300],
            });
            if (index < steps.length - 1) {
                connections[nodeName] = {
                    main: [[{ node: steps[index + 1].id ?? `Step_${index + 1}`, type: "main", index: 0 }]],
                };
            }
        });
        return {
            name: dsl.name ?? "automation-blueprint",
            nodes,
            connections,
            active: false,
            settings: {},
            tags: [],
        };
    }
}
index_1.AdapterRegistry.register(new N8nAdapter());
