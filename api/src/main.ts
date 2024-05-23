import { MikroORM } from '@mikro-orm/core';
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
  app.use(json({ limit: '96MB' }));
  app.use(urlencoded({ limit: '96MB', extended: true }));
  await app.get(MikroORM).getSchemaGenerator().ensureDatabase();
  await app.get(MikroORM).getSchemaGenerator().updateSchema(); // TODO: Move to migrations in production
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('CE Boostup XII API')
    .setDescription('Swagger UI for CE Boostup XII API.')
    .setVersion('0.0.2')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap();
