import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class CreateGroupDto {
  @ApiProperty({
    type: 'string',
    minLength: ConfigConstants.group.minNameLength,
    maxLength: ConfigConstants.group.maxNameLength,
    example: 'Ducks',
  })
  @IsString()
  @MinLength(ConfigConstants.group.minNameLength)
  @MaxLength(ConfigConstants.group.maxNameLength)
  name: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.group.maxDescriptionLength,
    example: 'Ducks group',
  })
  @IsString()
  @MaxLength(ConfigConstants.group.maxDescriptionLength)
  @IsOptional()
  description?: string;
}
