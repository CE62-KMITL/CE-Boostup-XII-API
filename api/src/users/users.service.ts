import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = new User();
    user.displayName = createUserDto.displayName;
    user.email = createUserDto.email;
    user.hashedPassword = '';
    user.groupId = createUserDto.groupId;
    return await this.usersRepository.save(user);
  }

  async findAll() {
    return await this.usersRepository.find({ relations: ['group'] });
  }

  async findOne(id: string) {
    return await this.usersRepository.findOne({
      where: { id },
      relations: ['group'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const result = await this.usersRepository.update(id, updateUserDto);
    if (!result.affected) {
      return null;
    }
    return await this.usersRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    return await this.usersRepository.delete(id);
  }
}
