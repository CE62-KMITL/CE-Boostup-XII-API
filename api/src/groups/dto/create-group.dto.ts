import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ minLength: 3, maxLength: 32, example: 'Ducks' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;

  @ApiProperty({ maxLength: 65535, example: 'Ducks group' })
  @IsString()
  @MaxLength(65535)
  description: string;
}
