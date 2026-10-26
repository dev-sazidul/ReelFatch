"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_CONFIG = void 0;
exports.facebookAccessToken = facebookAccessToken;
exports.loadConfig = loadConfig;
exports.APP_CONFIG = Symbol('APP_CONFIG');
function integer(env, key, fallback) {
    const raw = env[key];
    if (raw === undefined || raw.trim() === '')
        return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${key} must be a positive integer.`);
    }
    return value;
}
function facebookAccessToken(config) {
    return config.facebookPageAccessToken || config.facebookUserAccessToken;
}
function loadConfig(env) {
    const graphApiVersion = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
    if (!/^v\d+\.\d+$/.test(graphApiVersion)) {
        throw new Error('FACEBOOK_GRAPH_API_VERSION must look like v26.0.');
    }
    const corsOrigins = (env.CORS_ORIGIN?.trim() || 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return {
        port: integer(env, 'PORT', 3000),
        corsOrigins,
        graphApiVersion,
        facebookUserAccessToken: env.FACEBOOK_USER_ACCESS_TOKEN?.trim() ?? '',
        facebookPageAccessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ?? '',
        requestTimeoutMs: integer(env, 'REQUEST_TIMEOUT_MS', 12_000),
        downloadTimeoutMs: integer(env, 'DOWNLOAD_TIMEOUT_MS', 120_000),
        maxDownloadBytes: integer(env, 'MAX_DOWNLOAD_BYTES', 536_870_912),
        rateLimitTtlMs: integer(env, 'RATE_LIMIT_TTL_MS', 60_000),
        rateLimitLimit: integer(env, 'RATE_LIMIT_LIMIT', 60),
        lookupTtlMs: integer(env, 'LOOKUP_TTL_MS', 600_000),
    };
}
//# sourceMappingURL=app-config.js.map