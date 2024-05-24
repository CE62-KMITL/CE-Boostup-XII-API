import { join } from 'path';

import { LoadStrategy, MariaDbDriver } from '@mikro-orm/mariadb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttachmentsModule } from './attachments/attachments.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/roles.guard';
import { CompilerModule } from './compiler/compiler.module';
import configuration from './config/configuration';
import { GroupsModule } from './groups/groups.module';
import { MailModule } from './mail/mail.module';
import { ProblemTagsModule } from './problem-tags/problem-tags.module';
import { ProblemsModule } from './problems/problems.module';
import { SavesModule } from './saves/saves.module';
import { getUserIdTracker, skipIfPublicOrSuperAdmin } from './shared/throttler';
import { SubmissionsModule } from './submissions/submissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        driver: MariaDbDriver,
        host: configService.getOrThrow<string>('database.host'),
        port: configService.getOrThrow<number>('database.port'),
        dbName: configService.getOrThrow<string>('database.dbName'),
        user: configService.getOrThrow<string>('database.user'),
        password: configService.getOrThrow<string>('database.password'),
        name: configService.getOrThrow<string>('database.name'),
        charset: 'utf8mb4',
        loadStrategy: LoadStrategy.JOINED,
        autoLoadEntities: true,
        timezone: configService.getOrThrow<string>('database.timezone'),
        debug: configService.getOrThrow<boolean>('database.debug'),
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('auth.jwtExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('mail.smtpHost'),
          port: configService.getOrThrow<number>('mail.smtpPort'),
          secure: true,
          auth: {
            user: configService.getOrThrow<string>('mail.smtpUser'),
            pass: configService.getOrThrow<string>('mail.smtpPassword'),
          },
        },
        defaults: {
          from: `"${configService.getOrThrow<string>('mail.from')}" <${configService.getOrThrow<string>('mail.fromAddress')}>`,
        },
        template: {
          dir: join(__dirname, 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: configService.getOrThrow<number>('rateLimit.short.ttl'),
          limit: configService.getOrThrow<number>('rateLimit.short.limit'),
          getTracker: getUserIdTracker,
          skipIf: skipIfPublicOrSuperAdmin,
        },
        {
          name: 'medium',
          ttl: configService.getOrThrow<number>('rateLimit.medium.ttl'),
          limit: configService.getOrThrow<number>('rateLimit.medium.limit'),
          getTracker: getUserIdTracker,
          skipIf: skipIfPublicOrSuperAdmin,
        },
        {
          name: 'long',
          ttl: configService.getOrThrow<number>('rateLimit.long.ttl'),
          limit: configService.getOrThrow<number>('rateLimit.long.limit'),
          getTracker: getUserIdTracker,
          skipIf: skipIfPublicOrSuperAdmin,
        },
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    ProblemsModule,
    ProblemTagsModule,
    SavesModule,
    SubmissionsModule,
    AttachmentsModule,
    MailModule,
    CompilerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
