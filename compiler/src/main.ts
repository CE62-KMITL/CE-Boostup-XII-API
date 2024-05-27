import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '64MB' }));
  app.use(urlencoded({ limit: '64MB', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  await app.listen(5000);
}
bootstrap();
