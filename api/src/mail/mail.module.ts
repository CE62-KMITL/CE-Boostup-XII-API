import { join } from 'path';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { User } from 'src/users/entities/user.entity';

import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true }),
    MikroOrmModule.forFeature([User]),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_SMTP_HOST,
        secure: true,
        auth: {
          user: process.env.MAIL_SMTP_USER,
          pass: process.env.MAIL_SMTP_PASS,
        },
      },
      defaults: {
        from: `"${process.env.MAIL_SEND_FROM_NAME}" <${process.env.MAIL_SEND_FROM_ADDRESS}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
