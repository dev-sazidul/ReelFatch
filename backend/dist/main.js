"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const api_exception_filter_1 = require("./common/api-exception.filter");
const app_config_1 = require("./config/app-config");
async function bootstrap() {
    const config = (0, app_config_1.loadConfig)(process.env);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: config.corsOrigins,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['content-type', 'accept'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter());
    await app.listen(config.port, '0.0.0.0');
    common_1.Logger.log(`ReelFetch API listening on ${config.port}`, 'Bootstrap');
}
void bootstrap();
//# sourceMappingURL=main.js.map