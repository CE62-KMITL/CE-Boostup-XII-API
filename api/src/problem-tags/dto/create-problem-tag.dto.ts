import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProblemTagDto {
  @ApiProperty({ minLength: 3, maxLength: 32, example: 'Array' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;

  @ApiProperty({
    maxLength: 65535,
    example: 'Things involving square brackets',
  })
  @IsString()
  @MaxLength(65535)
  description: string;
}
