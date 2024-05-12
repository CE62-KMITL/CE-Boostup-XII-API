import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { MailService } from 'src/mail/mail.service';
import { TooManyRequestsException } from 'src/shared/exceptions/too-many-requests.exception';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.usersService.validatePassword(email, password);
    const payload = { sub: user.id, roles: user.roles };
    return {
      token: await this.jwtService.signAsync(payload),
    };
  }

  async requestAccountCreation(email: string, siteUrl: string) {
    const user = await this.usersService.findOneInternal({ email });
    if (!user) {
      throw new BadRequestException({
        message: 'Invalid email',
        errors: { email: 'Invalid email' },
      });
    }
    if (user.hashedPassword) {
      throw new BadRequestException({
        message: 'User already exists',
        errors: { email: 'User already exists' },
      });
    }
    if (
      user.lastEmailRequestedAt &&
      Date.now() - user.lastEmailRequestedAt.getTime() >
        ms(this.configService.getOrThrow<string>('auth.mailRequestCooldown'))
    ) {
      throw new TooManyRequestsException({
        message: 'Email request cooldown',
        errors: { request: 'Email request cooldown' },
      });
    }
    const payload = { id: user.id, type: 'create_account' };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>(
        'auth.mailRequestCooldown',
      ),
    });
    const url = `${siteUrl}/auth/create-account?token=${token}`;
    await this.usersService.updateInternal(
      { id: user.id },
      { lastEmailRequestedAt: new Date() },
    );
    await this.mailService.sendAccountCreationEmail(user.email, url);
    return { message: 'Email sent' };
  }

  async createAccount(token: string, password: string) {
    let payload: { id: string; type: string } | undefined;
    try {
      payload = await this.jwtService.verifyAsync<{
        id: string;
        type: string;
      }>(token);
    } catch {
      throw new BadRequestException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    if (payload.type !== 'create_account') {
      throw new BadRequestException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const user = await this.usersService.findOneInternal({ id: payload.id });
    if (user.hashedPassword) {
      throw new BadRequestException({
        message: 'User already exists',
        errors: { id: 'User already exists' },
      });
    }
    await this.usersService.updateInternal(
      { id: user.id },
      { hashedPassword: await this.usersService.hashPassword(password) },
    );
    return { message: 'Account created' };
  }

  async requestPasswordReset(email: string, siteUrl: string) {
    const user = await this.usersService.findOneInternal({ email });
    if (!user) {
      throw new BadRequestException({
        message: 'User not found',
        errors: { email: 'User not found' },
      });
    }
    if (!user.hashedPassword) {
      throw new BadRequestException({
        message: 'User not found',
        errors: { email: 'User not found' },
      });
    }
    if (
      user.lastEmailRequestedAt &&
      Date.now() - user.lastEmailRequestedAt.getTime() >
        ms(this.configService.getOrThrow<string>('auth.mailRequestCooldown'))
    ) {
      throw new TooManyRequestsException({
        message: 'Email request cooldown',
        errors: { request: 'Email request cooldown' },
      });
    }
    const payload = { id: user.id, type: 'reset_password' };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>(
        'auth.mailRequestCooldown',
      ),
    });
    const url = `${siteUrl}/auth/reset-password?token=${token}`;
    await this.usersService.updateInternal(
      { id: user.id },
      { lastEmailRequestedAt: new Date() },
    );
    await this.mailService.sendPasswordResetEmail(user.email, url);
    return { message: 'Email sent' };
  }

  async resetPassword(token: string, password: string) {
    let payload: { id: string; type: string } | undefined;
    try {
      payload = await this.jwtService.verifyAsync<{
        id: string;
        type: string;
      }>(token);
    } catch {
      throw new BadRequestException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    if (payload.type !== 'reset_password') {
      throw new BadRequestException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const user = await this.usersService.findOneInternal({ id: payload.id });
    if (!user.hashedPassword) {
      throw new BadRequestException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    await this.usersService.updateInternal(
      { id: user.id },
      { hashedPassword: await this.usersService.hashPassword(password) },
    );
    return { message: 'Password reset' };
  }
}