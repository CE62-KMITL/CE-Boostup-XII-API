import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.MARIADB_HOST || 'mariadb',
      port: process.env.MARIADB_PORT
        ? parseInt(process.env.MARIADB_PORT)
        : 3306,
      username: process.env.MARIADB_USER || 'ceboostupxii',
      password: process.env.MARIADB_PASSWORD || 'ceboostupxii',
      database: process.env.MARIADB_DATABASE || 'ceboostupxii',
      autoLoadEntities: true,
      synchronize: true, //TODO: Change to migration in production
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
