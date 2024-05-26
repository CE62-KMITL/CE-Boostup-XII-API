import { MikroORM } from '@mikro-orm/core';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import wcmatch from 'wildcard-match';

import { AppModule } from './app.module';
import { ConfigConstants } from './config/config-constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ConfigConstants.logLevels,
  });
  const configService = app.get(ConfigService);

  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Disable most of the security headers as they are irrelevant for a REST API
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      referrerPolicy: false,
      strictTransportSecurity: false, // This should be handled by a reverse proxy or CDN
      xDnsPrefetchControl: false,
      xDownloadOptions: false,
      xFrameOptions: false,
      xPermittedCrossDomainPolicies: false,
      xPoweredBy: false,
      xXssProtection: false,
    }),
  );

  const allowedOrigins =
    configService.getOrThrow<string[]>('CorsAllowedOrigins');
  const allowedOriginMatchers = allowedOrigins.map((origin) =>
    wcmatch(origin, { separator: '.' }),
  );
  const allowedOriginRegexes = allowedOriginMatchers.map(
    (matcher) => matcher.regexp,
  );
  app.enableCors({
    origin: allowedOriginRegexes,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 200,
    exposedHeaders: 'Authorization',
  });

  app.use(json({ limit: configService.getOrThrow<string>('maxBodySize') }));
  app.use(
    urlencoded({
      limit: configService.getOrThrow<string>('maxBodySize'),
      extended: true,
    }),
  );

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

  const mikroOrm = app.get(MikroORM);
  await mikroOrm.getSchemaGenerator().ensureDatabase();
  await mikroOrm.getSchemaGenerator().updateSchema(); // TODO: Move to migrations in production

  await app.listen(configService.getOrThrow<number>('port'));
}
bootstrap();
