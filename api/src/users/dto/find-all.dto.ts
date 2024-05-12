import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { PaginationRequest } from 'src/shared/dto/pagination.dto';

export class FindAllDto extends PaginationRequest {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451' })
  @IsUUID()
  @Transform(({ value }) => value || null)
  @ValidateIf((_, value) => value !== '')
  @IsOptional()
  group?: string;
}
