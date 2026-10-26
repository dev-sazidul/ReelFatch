import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { loadConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { HealthController } from './health/health.controller';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const config = loadConfig(process.env);
        return { throttlers: [{ ttl: config.rateLimitTtlMs, limit: config.rateLimitLimit }] };
      },
    }),
    VideosModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
