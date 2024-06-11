import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { ProgrammingLanguage } from 'src/shared/enums/programming-language.enum';

export class CreateSaveDto {
  @ApiProperty({
    type: 'string',
    example: '87415e9a-cc80-47e2-a9fb-ac635fce364a',
  })
  @IsUUID('4')
  problem: string;

  @ApiProperty({
    type: 'string',
    maxLength: ConfigConstants.save.maxCodeLength,
    example:
      '#include <stdio.h>\\n\\nint main() {\\n    printf("Hello World!");\\n}',
  })
  @IsString()
  @MaxLength(ConfigConstants.save.maxCodeLength)
  code: string;

  @ApiPropertyOptional({
    type: 'string',
    example: 'C++17',
  })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(ProgrammingLanguage)
  @IsOptional()
  language?: ProgrammingLanguage;
}
