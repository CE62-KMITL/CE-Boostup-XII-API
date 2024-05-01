import { PartialType } from '@nestjs/swagger';
import { CreateSaveDto } from './create-save.dto';

export class UpdateSaveDto extends PartialType(CreateSaveDto) {}
