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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const video_dto_1 = require("./video.dto");
const videos_service_1 = require("./videos.service");
let VideosController = class VideosController {
    videos;
    constructor(videos) {
        this.videos = videos;
    }
    lookup(body) {
        return this.videos.lookup(body.url);
    }
    metadata(lookupId) {
        return this.videos.getLookup(lookupId);
    }
    createDownload(body) {
        return this.videos.createDownload(body.lookupId, body.qualityId);
    }
    downloadStatus(jobId) {
        return this.videos.getDownload(jobId);
    }
    async downloadFile(jobId) {
        const opened = await this.videos.openDownload(jobId);
        return new common_1.StreamableFile(opened.stream, {
            type: opened.contentType,
            disposition: `attachment; filename="${opened.filename}"`,
            ...(opened.contentLength === undefined ? {} : { length: opened.contentLength }),
        });
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, common_1.Post)('lookup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [video_dto_1.LookupVideoDto]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "lookup", null);
__decorate([
    (0, common_1.Get)('lookups/:lookupId'),
    __param(0, (0, common_1.Param)('lookupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "metadata", null);
__decorate([
    (0, common_1.Post)('downloads'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [video_dto_1.CreateDownloadDto]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "createDownload", null);
__decorate([
    (0, common_1.Get)('downloads/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "downloadStatus", null);
__decorate([
    (0, common_1.Get)('downloads/:jobId/file'),
    (0, common_1.Header)('cache-control', 'no-store'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "downloadFile", null);
exports.VideosController = VideosController = __decorate([
    (0, common_1.Controller)('videos'),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map