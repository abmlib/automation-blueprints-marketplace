"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class ZapierAdapter {
    constructor() {
        this.runtime = "zapier";
    }
    toTargetFormat(dsl) {
        const trigger = dsl.trigger ?? {};
        return {
            name: dsl.name ?? "automation-blueprint",
            version: dsl.version ?? "0.1.0",
            triggers: {
                [trigger.event ?? "trigger"]: {
                    operation: {
                        perform: {
                            url: `https://example.com/trigger/${trigger.event}`,
                            method: "POST",
                        },
                    },
                },
            },
            searches: {},
            creates: {},
        };
    }
    canHandle() {
        return true;
    }
}
index_1.AdapterRegistry.register(new ZapierAdapter());
