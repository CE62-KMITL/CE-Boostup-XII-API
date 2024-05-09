import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class CreateSaveDto {
  @ApiProperty({ example: '87415e9a-cc80-47e2-a9fb-ac635fce364a' })
  @IsUUID('4')
  problemId: string;

  @ApiProperty({
    maxLength: ConfigConstants.save.maxCodeLength,
    example:
      '#include <stdio.h>\\n\\nint main() {\\n    printf("Hello World!");\\n}',
  })
  @IsString()
  @MaxLength(ConfigConstants.save.maxCodeLength)
  code: string;
}
