import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendAccountCreationEmail(email: string, url: string) {
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

  async sendPasswordResetEmail(email: string, url: string) {
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
