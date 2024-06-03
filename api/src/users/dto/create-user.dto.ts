import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { Role } from 'src/shared/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    type: 'string',
    minLength: ConfigConstants.user.minDisplayNameLength,
    maxLength: ConfigConstants.user.maxDisplayNameLength,
    example: 'John Doe',
  })
  @IsString()
  @MinLength(ConfigConstants.user.minDisplayNameLength)
  @MaxLength(ConfigConstants.user.maxDisplayNameLength)
  displayName: string;

  @ApiProperty({
    type: 'string',
    maxLength: ConfigConstants.user.maxEmailLength,
    example: 'example@example.com',
  })
  @MaxLength(ConfigConstants.user.maxEmailLength)
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    minLength: 1,
    example: ['User'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @ApiPropertyOptional({
    type: 'string',
    example: '87415e9a-cc80-47e2-a9fb-ac635fce364a',
  })
  @IsUUID('4')
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({
    type: 'string',
    minLength: ConfigConstants.user.minPasswordLength,
    maxLength: ConfigConstants.user.maxPasswordLength,
    example: 'P@ssw0rd!',
  })
  @MaxLength(ConfigConstants.user.maxPasswordLength)
  @IsStrongPassword({
    minLength: ConfigConstants.user.minPasswordLength,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsOptional()
  password?: string;
}
