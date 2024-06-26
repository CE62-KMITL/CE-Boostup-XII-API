import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from 'src/shared/dto/pagination.dto';

export class FindAllDto extends PaginationRequestDto {
  @ApiPropertyOptional({ type: 'string', example: 'Ducks' })
  @IsString()
  @IsOptional()
  search?: string;
}
