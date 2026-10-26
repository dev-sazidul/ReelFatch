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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDownloadDto = exports.LookupVideoDto = void 0;
const class_validator_1 = require("class-validator");
class LookupVideoDto {
    url;
}
exports.LookupVideoDto = LookupVideoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], LookupVideoDto.prototype, "url", void 0);
class CreateDownloadDto {
    lookupId;
    qualityId;
}
exports.CreateDownloadDto = CreateDownloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-f0-9]{32}$/),
    __metadata("design:type", String)
], CreateDownloadDto.prototype, "lookupId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['source']),
    __metadata("design:type", String)
], CreateDownloadDto.prototype, "qualityId", void 0);
//# sourceMappingURL=video.dto.js.map