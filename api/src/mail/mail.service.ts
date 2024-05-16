import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Webhook } from 'discord-webhook-node';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async sendAccountCreationEmail(email: string, url: string): Promise<void> {
    if (this.configService.getOrThrow<boolean>('mail.mock.enabled')) {
      const webhook = new Webhook(
        this.configService.getOrThrow<string>('mail.mock.discordWebhookUrl'),
      );
      await webhook.send(
        `Account creation email sent to ${email}, URL: ${url}`,
      );
      return;
    }
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Create your CE Boost up account!',
        template: 'create-account',
        context: {
          url,
        },
      });
    } catch (error) {
      console.error('Error sending account creation email:');
      console.error(error);
      throw new InternalServerErrorException({
        message: 'Error sending account creation email',
        errors: { email: 'Error sending account creation email' },
      });
    }
  }

  async sendPasswordResetEmail(email: string, url: string): Promise<void> {
    if (this.configService.getOrThrow<boolean>('mail.mock.enabled')) {
      const webhook = new Webhook(
        this.configService.getOrThrow<string>('mail.mock.discordWebhookUrl'),
      );
      await webhook.send(`Password reset email sent to ${email}, URL: ${url}`);
      return;
    }
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your CE Boost up password!',
        template: 'reset-password',
        context: {
          url,
        },
      });
    } catch (error) {
      console.error('Error sending password reset email:');
      console.error(error);
      throw new InternalServerErrorException({
        message: 'Error sending password reset email',
        errors: { email: 'Error sending password reset email' },
      });
    }
  }
}
