"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_config_1 = require("./config/app-config");
const config_module_1 = require("./config/config.module");
const health_controller_1 = require("./health/health.controller");
const videos_module_1 = require("./videos/videos.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            throttler_1.ThrottlerModule.forRootAsync({
                useFactory: () => {
                    const config = (0, app_config_1.loadConfig)(process.env);
                    return { throttlers: [{ ttl: config.rateLimitTtlMs, limit: config.rateLimitLimit }] };
                },
            }),
            videos_module_1.VideosModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map