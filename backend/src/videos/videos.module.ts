import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [ProvidersModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
