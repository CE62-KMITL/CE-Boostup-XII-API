import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type {
  JWTPayload,
  JWTPayloadCreateAccount,
  JWTPayloadResetPassword,
} from 'src/auth/auth';
import { CreateAccountDto } from 'src/auth/dto/create-account.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RequestAccountCreationDto } from 'src/auth/dto/request-account-creation.dto';
import { RequestPasswordResetDto } from 'src/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly usersRepository: EntityRepository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  createJWTPayload(user: User): JWTPayload {
    return {
      sub: user.id,
      email: user.email,
    };
  }

  sendEmail(link: string) {
    console.log(link);
    // throw new NotImplementedException(link);
  }

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOne({ email });
  }

  async login(loginDto: LoginDto) {
    const user = await this.findOneByEmail(loginDto.email);
    if (!user || !user.hashedPassword) {
      throw new BadRequestException({
        message: 'Invalid email or password',
      });
    }

    const correctPassword = await argon2.verify(
      user.hashedPassword,
      loginDto.password,
    );
    if (!correctPassword) {
      throw new BadRequestException({
        message: 'Invalid email or password',
      });
    }

    const token = this.jwtService.sign(this.createJWTPayload(user));
    return {
      token: token,
    };
  }

  async requestAccountCreation(
    requestAccountCreationDto: RequestAccountCreationDto,
  ) {
    const user = await this.findOneByEmail(requestAccountCreationDto.email);

    if (!user || user.hashedPassword !== '') {
      throw new BadRequestException({
        message: 'Invalid email',
      });
    }

    const payload: JWTPayloadCreateAccount = {
      ...this.createJWTPayload(user),
      createAccount: true,
    };
    const token = this.jwtService.sign(payload);
    const link = `${requestAccountCreationDto.siteUrl}/auth/create-account?token=${token}`;
    this.sendEmail(link);

    return {
      message: 'Account creation email has been sent',
    };
  }

  async createAccount(createAccountDto: CreateAccountDto) {
    const payload: JWTPayloadCreateAccount = this.jwtService.verify(
      createAccountDto.token,
    );
    if (!payload.createAccount) {
      throw new BadRequestException({
        message: 'Invalid token or displayName',
      });
    }

    const user = await this.findOneByEmail(payload.email);
    if (!user) {
      throw new BadRequestException({
        message: 'Invalid token or displayName',
      });
    }

    user.hashedPassword = await argon2.hash(createAccountDto.password);
    user.displayName = createAccountDto.displayName;
    await this.entityManager.flush();

    return {
      message: 'Account has been created',
    };
  }

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
    const user = await this.findOneByEmail(requestPasswordResetDto.email);

    if (!user) {
      throw new BadRequestException({
        message: 'Invalid email',
      });
    }

    const payload: JWTPayloadResetPassword = {
      ...this.createJWTPayload(user),
      resetPassword: true,
    };
    const token = this.jwtService.sign(payload);
    const link = `${requestPasswordResetDto.siteUrl}/auth/reset-password?token=${token}`;
    this.sendEmail(link);

    return {
      message: 'Password reset email has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const payload: JWTPayloadCreateAccount = this.jwtService.verify(
      resetPasswordDto.token,
    );
    if (!payload.createAccount) {
      throw new BadRequestException({
        message: 'Invalid token',
      });
    }

    const user = await this.findOneByEmail(payload.email);
    if (!user) {
      throw new BadRequestException({
        message: 'Invalid token',
      });
    }

    user.hashedPassword = await argon2.hash(resetPasswordDto.password);
    await this.entityManager.flush();

    return {
      message: 'Password has been reset',
    };
  }
}
