import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class CreateAttachmentDto {
  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.attachment.maxNameLength,
    example: 'Virus.exe',
  })
  @IsString()
  @MaxLength(ConfigConstants.attachment.maxNameLength)
  @IsOptional()
  name?: string;

  @ApiProperty({ type: 'file' })
  file: any;
}
