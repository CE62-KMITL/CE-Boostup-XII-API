import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';

import { CreateProblemDto } from './create-problem.dto';

export class UpdateProblemDto extends PartialType(CreateProblemDto) {
  @ApiPropertyOptional({ example: 'Approved', enum: PublicationStatus })
  @IsEnum(PublicationStatus)
  @IsOptional()
  publicationStatus?: PublicationStatus;

  @ApiPropertyOptional({ type: 'string', example: 'Outside of scope' })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxReviewCommentLength)
  @IsOptional()
  reviewComment?: string;

  @ApiPropertyOptional({ type: 'boolean', example: true })
  @IsBoolean()
  @IsOptional()
  unlockHint?: boolean;
}
