"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class MakeAdapter {
    constructor() {
        this.runtime = "make";
    }
    /**
     * Converts automation blueprint DSL to Make (Integromat) scenario format.
     */
    toTargetFormat(dsl) {
        const trigger = dsl.trigger ?? {};
        const steps = dsl.steps ?? [];
        const flow = [
            {
                id: 1,
                module: `${trigger.app ?? "webhook"}:${trigger.event ?? "trigger"}`,
                version: 1,
                parameters: {},
                mapper: {},
                metadata: {
                    designer: { x: 0, y: 0 },
                    restore: {},
                    expect: [
                        {
                            name: "event",
                            type: "text",
                            label: "Event Type",
                            required: false,
                        },
                    ],
                },
            },
        ];
        steps.forEach((step, index) => {
            flow.push({
                id: index + 2,
                module: `${step.app ?? "tools"}:${step.action ?? "set-variable"}`,
                version: 1,
                parameters: step.inputs ?? {},
                mapper: step.transforms ?? {},
                metadata: {
                    designer: { x: 0, y: (index + 1) * 150 },
                    restore: {},
                },
            });
        });
        return {
            name: dsl.name ?? "automation-blueprint",
            flow,
            metadata: {
                version: 1,
                scenario: { roundtrips: 1, maxErrors: 3 },
            },
        };
    }
}
index_1.AdapterRegistry.register(new MakeAdapter());
