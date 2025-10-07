"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterRegistry = void 0;
class AdapterRegistry {
    static register(adapter) {
        this.adapters.set(adapter.runtime, adapter);
    }
    static get(runtime) {
        return this.adapters.get(runtime);
    }
    static list() {
        return [...this.adapters.keys()];
    }
}
exports.AdapterRegistry = AdapterRegistry;
AdapterRegistry.adapters = new Map();
// Auto-register built-in adapters. Keep at bottom to avoid circular deps issues.
require("./zapier-adapter");
require("./make-adapter");
require("./n8n-adapter");
require("./power-automate-adapter");
