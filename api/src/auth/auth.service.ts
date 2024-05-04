import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { LoginDto } from 'src/auth/dto/login.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: EntityRepository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  async findOne(loginDto: LoginDto) {
    const findOneOptions = {
      email: loginDto.email,
    };
    const user = await this.usersRepository.findOne(findOneOptions);

    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException();
    }

    const correctPassword = await argon2.verify(
      user.hashedPassword,
      loginDto.password,
    );

    if (correctPassword) {
      return user;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.findOne(loginDto);
    // TODO: generate jwt and returns it
    throw new NotImplementedException(user);
  }
}
