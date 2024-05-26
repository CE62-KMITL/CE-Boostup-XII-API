import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class CreateProblemTagDto {
  @ApiProperty({
    minLength: ConfigConstants.problemTag.minNameLength,
    maxLength: ConfigConstants.problemTag.maxNameLength,
    example: 'Array',
  })
  @IsString()
  @MinLength(ConfigConstants.problemTag.minNameLength)
  @MaxLength(ConfigConstants.problemTag.maxNameLength)
  name: string;

  @ApiPropertyOptional({
    maxLength: ConfigConstants.problemTag.maxDescriptionLength,
    example: 'Things involving square brackets',
  })
  @IsString()
  @MaxLength(ConfigConstants.problemTag.maxDescriptionLength)
  @IsOptional()
  description?: string;
}
