import { LoadStrategy, MariaDbDriver } from '@mikro-orm/mariadb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttachmentsModule } from './attachments/attachments.module';
import { GroupsModule } from './groups/groups.module';
import { ProblemTagsModule } from './problem-tags/problem-tags.module';
import { ProblemsModule } from './problems/problems.module';
import { SavesModule } from './saves/saves.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true }),
    MikroOrmModule.forRoot({
      driver: MariaDbDriver,
      host: process.env.MARIADB_HOST || 'mariadb',
      port: process.env.MARIADB_PORT ? +process.env.MARIADB_PORT : 3306,
      dbName: process.env.MARIADB_DATABASE || 'ceboostupxii',
      user: process.env.MARIADB_USER || 'ceboostupxii',
      password: process.env.MARIADB_PASSWORD || 'ceboostupxii',
      name: process.env.MARIADB_NAME || 'unknown',
      charset: 'utf8mb4',
      loadStrategy: LoadStrategy.JOINED,
      autoLoadEntities: true,
      timezone: process.env.TZ || '+07:00',
      debug: true, // TODO: Disable debug in production
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
