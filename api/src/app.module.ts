import { LoadStrategy, MariaDbDriver } from '@mikro-orm/mariadb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttachmentsModule } from './attachments/attachments.module';
import configuration from './config/configuration';
import { GroupsModule } from './groups/groups.module';
import { ProblemTagsModule } from './problem-tags/problem-tags.module';
import { ProblemsModule } from './problems/problems.module';
import { SavesModule } from './saves/saves.module';
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
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.getOrThrow<string>(
            'storages.attachments.path',
          ),
          filename: (_, file, cb) =>
            cb(null, `${uuidv4()}.${file.originalname.split('.').pop()}`),
        }),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    GroupsModule,
    ProblemsModule,
    ProblemTagsModule,
    SavesModule,
    SubmissionsModule,
    AttachmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
