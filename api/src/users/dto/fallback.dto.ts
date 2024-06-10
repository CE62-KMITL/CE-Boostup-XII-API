import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FallbackDto {
  @ApiPropertyOptional({ type: 'string', example: 'true' })
  @IsString()
  @IsOptional()
  fallback: string = 'true';
}
