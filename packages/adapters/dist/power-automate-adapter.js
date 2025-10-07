"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class PowerAutomateAdapter {
    constructor() {
        this.runtime = "power-automate";
    }
    toTargetFormat(dsl) {
        const trigger = dsl.trigger ?? {};
        const steps = dsl.steps ?? [];
        const triggerName = trigger.event ?? "manual";
        const triggers = {
            [triggerName]: {
                type: this.mapTriggerType(trigger.app),
                kind: "Http",
                inputs: { schema: {}, method: "POST" },
            },
        };
        const actions = {};
        let previous = null;
        steps.forEach((step, idx) => {
            const name = step.id ?? `Action_${idx}`;
            actions[name] = {
                type: this.mapActionType(step.app, step.action),
                inputs: step.inputs ?? {},
                runAfter: previous ? { [previous]: ["Succeeded"] } : {},
            };
            if (step.transforms) {
                step.transforms.forEach((t, tIdx) => {
                    const tName = `${name}_Transform_${tIdx}`;
                    actions[tName] = {
                        type: "Compose",
                        inputs: `@{${t.operation}(body('${name}')?['${t.field}'])}`,
                        runAfter: { [name]: ["Succeeded"] },
                    };
                });
            }
            previous = name;
        });
        return {
            $schema: "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
            contentVersion: "1.0.0.0",
            parameters: {},
            triggers,
            actions,
            outputs: {},
        };
    }
    mapTriggerType(app) {
        const map = {
            http: "Request",
            webhook: "HttpWebhook",
            recurrence: "Recurrence",
        };
        return map[app ?? "http"] ?? "Request";
    }
    mapActionType(app, action) {
        if (app === "http")
            return "Http";
        if (action === "compose")
            return "Compose";
        return "ApiConnection";
    }
}
index_1.AdapterRegistry.register(new PowerAutomateAdapter());
