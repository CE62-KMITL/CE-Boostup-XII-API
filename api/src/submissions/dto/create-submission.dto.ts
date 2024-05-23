import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

import { ProgrammingLanguage } from '../entities/submission.entity';

export class CreateSubmissionDto {
  @ApiProperty({
    type: 'string',
    example: '28fdc367-e76c-4b60-912a-de937aa40f7f',
  })
  @IsUUID()
  problem: string;

  @ApiProperty({
    type: 'string',
    maxLength: ConfigConstants.submission.maxCodeLength,
    example:
      '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}',
  })
  @IsString()
  @MaxLength(ConfigConstants.submission.maxCodeLength)
  code: string;

  @ApiProperty({
    type: 'string',
    example: 'C++17',
  })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;
}
