import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSaveDto {
  @ApiProperty({ example: '87415e9a-cc80-47e2-a9fb-ac635fce364a' })
  @IsUUID('4')
  problemId: string;

  @ApiProperty({
    example:
      '#include <stdio.h>\\n\\nint main() {\\n    printf("Hello World!");\\n}',
  })
  @IsString()
  @MaxLength(65535)
  code: string;
}
