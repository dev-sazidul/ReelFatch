"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersModule = void 0;
const common_1 = require("@nestjs/common");
const app_config_1 = require("../config/app-config");
const facebook_provider_1 = require("./facebook/facebook.provider");
let ProvidersModule = class ProvidersModule {
};
exports.ProvidersModule = ProvidersModule;
exports.ProvidersModule = ProvidersModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: facebook_provider_1.FacebookVideoProvider,
                inject: [app_config_1.APP_CONFIG],
                useFactory: (config) => new facebook_provider_1.FacebookVideoProvider(config),
            },
        ],
        exports: [facebook_provider_1.FacebookVideoProvider],
    })
], ProvidersModule);
//# sourceMappingURL=providers.module.js.map