import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { ConfigConstants } from './config/config-constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ConfigConstants.logLevels,
  });
  app.use(json({ limit: '64MB' }));
  app.use(urlencoded({ limit: '64MB', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('CE Boostup XII Compiler API')
    .setDescription('Swagger UI for CE Boostup XII Compiler API.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap();
