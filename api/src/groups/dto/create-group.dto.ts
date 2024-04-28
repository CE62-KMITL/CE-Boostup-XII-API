import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ minLength: 3, maxLength: 32, example: 'Ducks' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;

  @ApiProperty({ maxLength: 255, example: 'Ducks group' })
  @IsString()
  @MaxLength(255)
  description: string;
}
