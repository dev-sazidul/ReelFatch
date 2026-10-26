"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.redactSensitive = redactSensitive;
class ApiError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.ApiError = ApiError;
function redactSensitive(text, secrets) {
    let output = text;
    for (const secret of secrets) {
        if (secret.length < 8)
            continue;
        output = output.split(secret).join('[redacted]');
    }
    return output.slice(0, 400);
}
//# sourceMappingURL=api-error.js.map