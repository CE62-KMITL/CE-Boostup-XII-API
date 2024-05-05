import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { LocalStrategy } from 'src/auth/local.strategy';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([User]),
    JwtModule.register({
      // secret: process.env.JWT_ES256_SECRET,
      privateKey: process.env.JWT_ES256_SECRET,
      // secretOrPrivateKey: process.env.JWT_ES256_SECRET,
      signOptions: {
        algorithm: 'ES256',
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
