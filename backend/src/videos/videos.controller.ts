import { Body, Controller, Get, Header, Param, Post, StreamableFile } from '@nestjs/common';
import { CreateDownloadDto, LookupVideoDto } from './video.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Post('lookup')
  lookup(@Body() body: LookupVideoDto) {
    return this.videos.lookup(body.url);
  }

  @Get('lookups/:lookupId')
  metadata(@Param('lookupId') lookupId: string) {
    return this.videos.getLookup(lookupId);
  }

  @Post('downloads')
  createDownload(@Body() body: CreateDownloadDto) {
    return this.videos.createDownload(body.lookupId, body.qualityId);
  }

  @Get('downloads/:jobId')
  downloadStatus(@Param('jobId') jobId: string) {
    return this.videos.getDownload(jobId);
  }

  @Get('downloads/:jobId/file')
  @Header('cache-control', 'no-store')
  async downloadFile(@Param('jobId') jobId: string) {
    const opened = await this.videos.openDownload(jobId);
    return new StreamableFile(opened.stream, {
      type: opened.contentType,
      disposition: `attachment; filename="${opened.filename}"`,
      ...(opened.contentLength === undefined ? {} : { length: opened.contentLength }),
    });
  }
}
