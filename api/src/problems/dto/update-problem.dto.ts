import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';

import { CreateProblemDto } from './create-problem.dto';

export class UpdateProblemDto extends PartialType(CreateProblemDto) {
  @ApiPropertyOptional({ example: 'Approved', enum: PublicationStatus })
  @IsEnum(PublicationStatus)
  @IsOptional()
  publicationStatus?: PublicationStatus;
}
