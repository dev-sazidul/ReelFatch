"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostMatches = hostMatches;
function hostMatches(hostname, domain) {
    const host = hostname.toLowerCase().replace(/\.$/, '');
    return host === domain || host.endsWith(`.${domain}`);
}
//# sourceMappingURL=video-provider.js.map