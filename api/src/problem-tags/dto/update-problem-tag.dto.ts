import { PartialType } from '@nestjs/swagger';

import { CreateProblemTagDto } from './create-problem-tag.dto';

export class UpdateProblemTagDto extends PartialType(CreateProblemTagDto) {}
