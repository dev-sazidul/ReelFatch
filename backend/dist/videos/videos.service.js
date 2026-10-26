"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VideosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosService = void 0;
const common_1 = require("@nestjs/common");
const api_error_1 = require("../common/api-error");
const app_config_1 = require("../config/app-config");
const facebook_provider_1 = require("../providers/facebook/facebook.provider");
const provider_registry_1 = require("../providers/provider-registry");
const url_safety_1 = require("../security/url-safety");
const media_stream_1 = require("../security/media-stream");
const video_store_1 = require("./video-store");
let VideosService = VideosService_1 = class VideosService {
    config;
    logger = new common_1.Logger(VideosService_1.name);
    lookups = new video_store_1.LookupStore();
    jobs = new video_store_1.DownloadJobStore();
    providers;
    constructor(config, facebook) {
        this.config = config;
        this.providers = [facebook, ...(0, provider_registry_1.futurePlatformProviders)()];
    }
    async lookup(rawUrl) {
        const { url, provider } = (0, provider_registry_1.selectProvider)(rawUrl, this.providers);
        this.logger.log(`lookup start platform=${provider.platform} url=${(0, url_safety_1.redactUrl)(url.toString())}`);
        const result = await provider.lookup(url);
        const stored = this.lookups.save(result, this.config.lookupTtlMs);
        this.logger.log(`lookup stored platform=${provider.platform} qualities=${result.qualities.length}`);
        return (0, video_store_1.toPublicLookup)(stored);
    }
    getLookup(lookupId) {
        const record = this.requireLookup(lookupId);
        return (0, video_store_1.toPublicLookup)(record);
    }
    async createDownload(lookupId, qualityId) {
        const record = this.requireLookup(lookupId);
        const quality = record.qualities.find((item) => item.id === qualityId && item.available);
        if (!quality)
            throw new api_error_1.ApiError(400, 'QUALITY_UNAVAILABLE', 'That quality is not available for this video.');
        if (record.platform !== 'facebook') {
            throw new api_error_1.ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.');
        }
        const facebook = this.facebook();
        await facebook.getAuthorizedSource(record.videoId);
        const job = this.jobs.create(lookupId, qualityId, this.config.lookupTtlMs);
        this.logger.log(`download job ready id=${job.jobId}`);
        return { jobId: job.jobId, status: job.status };
    }
    getDownload(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new api_error_1.ApiError(404, 'JOB_NOT_FOUND', 'That download job does not exist or has expired.');
        return {
            jobId: job.jobId,
            status: job.status,
            errorCode: job.errorCode,
            errorMessage: job.errorMessage,
        };
    }
    async openDownload(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new api_error_1.ApiError(404, 'JOB_NOT_FOUND', 'That download job does not exist or has expired.');
        const record = this.requireLookup(job.lookupId);
        if (record.platform !== 'facebook') {
            throw new api_error_1.ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.');
        }
        try {
            const source = await this.facebook().getAuthorizedSource(record.videoId);
            const media = await (0, media_stream_1.openAllowedMedia)(source.sourceUrl, {
                timeoutMs: this.config.downloadTimeoutMs,
                maxBytes: this.config.maxDownloadBytes,
            });
            this.jobs.update(job.jobId, { status: 'streaming' });
            media.stream.on('end', () => this.jobs.update(job.jobId, { status: 'completed' }));
            media.stream.on('error', (error) => {
                this.logger.warn(`download failed id=${job.jobId} message=${error.message}`);
                this.jobs.update(job.jobId, { status: 'failed', errorCode: 'VIDEO_NOT_AVAILABLE', errorMessage: 'The video file could not be transferred.' });
            });
            return { ...media, filename: source.filename };
        }
        catch (error) {
            const apiError = error instanceof api_error_1.ApiError ? error : new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.');
            this.jobs.update(job.jobId, { status: 'failed', errorCode: apiError.code, errorMessage: apiError.message });
            throw apiError;
        }
    }
    requireLookup(lookupId) {
        if (!/^[a-f0-9]{32}$/.test(lookupId))
            throw new api_error_1.ApiError(400, 'INVALID_REQUEST', 'The lookup id is not valid.');
        const record = this.lookups.get(lookupId);
        if (!record)
            throw new api_error_1.ApiError(404, 'LOOKUP_NOT_FOUND', 'That lookup does not exist or has expired. Check the link again.');
        return record;
    }
    facebook() {
        const facebook = this.providers.find((provider) => provider.platform === 'facebook');
        if (!(facebook instanceof facebook_provider_1.FacebookVideoProvider)) {
            throw new api_error_1.ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'The Facebook provider is not registered.');
        }
        return facebook;
    }
};
exports.VideosService = VideosService;
exports.VideosService = VideosService = VideosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.APP_CONFIG)),
    __metadata("design:paramtypes", [Object, facebook_provider_1.FacebookVideoProvider])
], VideosService);
//# sourceMappingURL=videos.service.js.map