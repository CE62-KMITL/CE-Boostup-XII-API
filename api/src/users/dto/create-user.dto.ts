import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { Role } from 'src/shared/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    minLength: ConfigConstants.user.minDisplayNameLength,
    maxLength: ConfigConstants.user.maxDisplayNameLength,
    example: 'John Doe',
  })
  @IsString()
  @MinLength(ConfigConstants.user.minDisplayNameLength)
  @MaxLength(ConfigConstants.user.maxDisplayNameLength)
  displayName: string;

  @ApiProperty({
    maxLength: ConfigConstants.user.maxEmailLength,
    example: 'example@example.com',
  })
  @MaxLength(ConfigConstants.user.maxEmailLength)
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 1, example: ['User'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @ApiProperty({ example: '87415e9a-cc80-47e2-a9fb-ac635fce364a' })
  @IsUUID('4')
  group: string;
}
