import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import ms from 'ms';
import { TooManyRequestsException } from 'src/too-many-requests.exception';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: EntityRepository<User>,
    private readonly entityManager: EntityManager,

    private mailerService: MailerService,
  ) {}

  async enforceCooldown(user: User) {
    if (!user.lastEmailRequestedAt || !process.env.MAIL_REQUEST_COOLDOWN) {
      throw new InternalServerErrorException();
    }

    const msSinceLastRequest: number =
      new Date().getTime() - user.lastEmailRequestedAt.getTime();
    const msRequestCooldown: number = ms(process.env.MAIL_REQUEST_COOLDOWN);

    console.log(msSinceLastRequest);
    console.log(msRequestCooldown);
    if (msSinceLastRequest < msRequestCooldown) {
      throw new TooManyRequestsException();
    }

    user.lastEmailRequestedAt = new Date();
    this.entityManager.flush();
  }

  async sendAccountCreationEmail(user: User, url: string) {
    await this.enforceCooldown(user);
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Create your CE Boost up account!',
      template: './create-account',
      context: {
        url,
      },
    });
  }

  async sendResetPasswordEmail(user: User, url: string) {
    await this.enforceCooldown(user);
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset your CE Boost up password.',
      template: './reset-password',
      context: {
        url,
      },
    });
  }
}
