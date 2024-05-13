import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationRequest } from 'src/shared/dto/pagination.dto';

export class FindAllDto extends PaginationRequest {
  @ApiPropertyOptional({ example: 'Array.pdf' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451' })
  @IsUUID()
  @IsOptional()
  owner?: string;
}
