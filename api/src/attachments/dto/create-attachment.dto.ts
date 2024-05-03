import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateAttachmentDto {
  @ApiPropertyOptional({ maxLength: 255, example: 'Virus.exe' })
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ type: 'file' })
  file: any;
}
