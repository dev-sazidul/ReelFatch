"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadJobStore = exports.LookupStore = void 0;
exports.toPublicLookup = toPublicLookup;
const node_crypto_1 = require("node:crypto");
/**
 * In-process lookup and download records. A BullMQ queue can replace DownloadJobStore
 * when Redis is available; controllers should keep calling this service instead of Redis directly.
 */
class LookupStore {
    records = new Map();
    save(lookup, ttlMs) {
        const record = { ...lookup, lookupId: (0, node_crypto_1.randomBytes)(16).toString('hex'), expiresAt: Date.now() + ttlMs };
        this.records.set(record.lookupId, record);
        return record;
    }
    get(lookupId) {
        this.purge();
        const record = this.records.get(lookupId);
        if (!record || record.expiresAt <= Date.now())
            return undefined;
        return record;
    }
    purge() {
        const now = Date.now();
        for (const [id, record] of this.records) {
            if (record.expiresAt <= now)
                this.records.delete(id);
        }
    }
}
exports.LookupStore = LookupStore;
class DownloadJobStore {
    jobs = new Map();
    create(lookupId, qualityId, ttlMs) {
        const job = {
            jobId: (0, node_crypto_1.randomBytes)(16).toString('hex'),
            lookupId,
            qualityId,
            status: 'ready',
            createdAt: Date.now(),
            expiresAt: Date.now() + ttlMs,
        };
        this.jobs.set(job.jobId, job);
        return job;
    }
    get(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job.expiresAt <= Date.now())
            return undefined;
        return job;
    }
    update(jobId, patch) {
        const job = this.get(jobId);
        if (!job)
            return undefined;
        Object.assign(job, patch);
        return job;
    }
}
exports.DownloadJobStore = DownloadJobStore;
function toPublicLookup(record) {
    return {
        lookupId: record.lookupId,
        platform: record.platform,
        title: record.title,
        description: record.description,
        thumbnailUrl: record.thumbnailUrl,
        sourceLabel: record.sourceLabel,
        qualities: record.qualities,
        reportedFormats: record.reportedFormats,
    };
}
//# sourceMappingURL=video-store.js.map