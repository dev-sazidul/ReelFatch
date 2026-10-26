"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApiExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const api_error_1 = require("./api-error");
let ApiExceptionFilter = ApiExceptionFilter_1 = class ApiExceptionFilter {
    logger = new common_1.Logger(ApiExceptionFilter_1.name);
    catch(exception, host) {
        const response = host.switchToHttp().getResponse();
        if (exception instanceof api_error_1.ApiError) {
            this.logger.warn(`${exception.code} HTTP ${exception.statusCode}`);
            response.status(exception.statusCode).json({
                code: exception.code,
                message: exception.message,
                details: exception.details,
            });
            return;
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            const raw = typeof body === 'string' ? body : body.message;
            const text = Array.isArray(raw) ? raw.join(' ') : raw || 'Request could not be processed.';
            const code = status === 429 ? 'RATE_LIMITED' : 'INVALID_REQUEST';
            const message = status === 429 ? 'Too many requests. Wait a moment and try again.' : String(text).slice(0, 300);
            this.logger.warn(`${code} HTTP ${status}`);
            response.status(status).json({ code, message });
            return;
        }
        const message = exception instanceof Error ? exception.message : 'Unknown server error';
        this.logger.error(message);
        response.status(500).json({
            code: 'INTERNAL_ERROR',
            message: 'The server could not complete this request.',
        });
    }
};
exports.ApiExceptionFilter = ApiExceptionFilter;
exports.ApiExceptionFilter = ApiExceptionFilter = ApiExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], ApiExceptionFilter);
//# sourceMappingURL=api-exception.filter.js.map