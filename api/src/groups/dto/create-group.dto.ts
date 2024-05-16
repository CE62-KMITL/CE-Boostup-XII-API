import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ConfigConstants } from '../../config/config-constants';

export class CreateGroupDto {
  @ApiProperty({
    minLength: ConfigConstants.group.minNameLength,
    maxLength: ConfigConstants.group.maxNameLength,
    example: 'Ducks',
  })
  @IsString()
  @MinLength(ConfigConstants.group.minNameLength)
  @MaxLength(ConfigConstants.group.maxNameLength)
  name: string;

  @ApiProperty({
    maxLength: ConfigConstants.group.maxDescriptionLength,
    example: 'Ducks group',
  })
  @IsString()
  @MaxLength(ConfigConstants.group.maxDescriptionLength)
  description: string;
}
