import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UsersModule } from 'src/users/users.module';
import { v4 as uuidv4 } from 'uuid';

import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './entities/attachment.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([Attachment]),
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
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
