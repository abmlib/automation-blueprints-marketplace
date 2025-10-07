"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dslSchema = void 0;
exports.validateDsl = validateDsl;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - compiled json import
const schema_json_1 = __importDefault(require("./schema.json"));
exports.dslSchema = schema_json_1.default;
const ajv = new ajv_1.default({ allErrors: true, strict: false });
(0, ajv_formats_1.default)(ajv);
const validateFn = ajv.compile(schema_json_1.default);
function validateDsl(dsl) {
    const ok = validateFn(dsl);
    return {
        ok: !!ok,
        errors: validateFn.errors?.map((e) => {
            const instancePath = e.instancePath ? e.instancePath.replace(/^\//, "") : "";
            const property = instancePath || e.params.missingProperty || "";
            const message = e.message ?? "validation error";
            return `${property ? `${property}: ` : ""}${message}`;
        }),
        warnings: [],
    };
}
