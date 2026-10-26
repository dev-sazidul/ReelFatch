import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { APP_CONFIG, facebookAccessToken, type AppConfig } from '../config/app-config';

@Controller('health')
export class HealthController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Get()
  @SkipThrottle()
  health() {
    return {
      status: 'ok',
      providers: {
        facebook: {
          mode: 'graph-api',
          configured: facebookAccessToken(this.config).length > 0,
          graphApiVersion: this.config.graphApiVersion,
        },
        youtube: { configured: false, reason: 'Official Data API does not provide video files.' },
        tiktok: { configured: false, reason: 'No authorized download provider is configured.' },
        instagram: { configured: false, reason: 'No authorized download provider is configured.' },
      },
    };
  }
}
