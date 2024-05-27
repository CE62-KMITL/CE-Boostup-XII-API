import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CompilerService } from './compiler.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>('api.compiler.url'),
        timeout: configService.getOrThrow<number>('api.compiler.timeout'),
        responseType: 'json',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        maxRedirects: 0,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CompilerService],
  exports: [CompilerService],
})
export class CompilerModule {}
