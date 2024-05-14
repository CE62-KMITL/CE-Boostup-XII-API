import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationRequestDto } from 'src/shared/dto/pagination.dto';

export class FindAllDto extends PaginationRequestDto {
  @ApiPropertyOptional({ example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451' })
  @IsUUID('4')
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({ example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451' })
  @IsUUID('4')
  @IsOptional()
  problem?: string;
}
