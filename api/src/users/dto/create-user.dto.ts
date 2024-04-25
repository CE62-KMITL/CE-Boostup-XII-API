import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ minLength: 3, maxLength: 32, example: 'John Doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  displayName: string;

  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '87415e9a-cc80-47e2-a9fb-ac635fce364a' })
  @IsUUID('4')
  groupId: string;
}
