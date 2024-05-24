import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateSaveDto } from './create-save.dto';

export class UpdateSaveDto extends PartialType(
  OmitType(CreateSaveDto, ['problem'] as const),
) {}
