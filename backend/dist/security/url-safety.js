"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePublicHttpUrl = parsePublicHttpUrl;
exports.isAllowedMediaUrl = isAllowedMediaUrl;
exports.redactUrl = redactUrl;
const api_error_1 = require("../common/api-error");
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);
function isIpAddress(hostname) {
    if (hostname.startsWith('[') || hostname.includes(':'))
        return true;
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}
function parsePublicHttpUrl(rawUrl) {
    const value = rawUrl.trim();
    if (!value || value.length > 2000) {
        throw new api_error_1.ApiError(400, 'INVALID_URL', 'Enter one http or https video link.');
    }
    let url;
    try {
        url = new URL(value);
    }
    catch {
        throw new api_error_1.ApiError(400, 'INVALID_URL', 'Enter a complete link beginning with https:// or http://.');
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new api_error_1.ApiError(400, 'INVALID_URL', 'Only http and https links can be checked.');
    }
    if (url.username || url.password) {
        throw new api_error_1.ApiError(400, 'INVALID_URL', 'Links that include a username or password are not accepted.');
    }
    if (url.port && url.port !== '80' && url.port !== '443') {
        throw new api_error_1.ApiError(400, 'INVALID_URL', 'Only standard web ports are accepted.');
    }
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host || isIpAddress(host) || BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
        throw new api_error_1.ApiError(400, 'INVALID_URL', 'That host is not allowed.');
    }
    return url;
}
function isAllowedMediaUrl(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
        return false;
    }
    if (url.protocol !== 'https:' || url.username || url.password)
        return false;
    if (url.port && url.port !== '443')
        return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host || isIpAddress(host) || BLOCKED_HOSTS.has(host) || host.endsWith('.local'))
        return false;
    return host === 'fbcdn.net' || host.endsWith('.fbcdn.net') || host === 'fbsbx.com' || host.endsWith('.fbsbx.com');
}
function redactUrl(rawUrl) {
    try {
        const url = new URL(rawUrl.trim());
        for (const key of [...url.searchParams.keys()]) {
            if (/token|cookie|password|secret|auth|session|credential/i.test(key))
                url.searchParams.set(key, '[redacted]');
        }
        return url.toString().slice(0, 300);
    }
    catch {
        return '[unparsed url]';
    }
}
//# sourceMappingURL=url-safety.js.map