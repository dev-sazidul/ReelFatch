import { Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { FacebookVideoProvider } from './facebook/facebook.provider';

@Module({
  providers: [
    {
      provide: FacebookVideoProvider,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => new FacebookVideoProvider(config),
    },
  ],
  exports: [FacebookVideoProvider],
})
export class ProvidersModule {}
