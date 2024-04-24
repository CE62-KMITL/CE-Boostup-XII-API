import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ minLength: 3, maxLength: 32, example: 'Ducks' })
  name: string;

  @ApiProperty({ maxLength: 255, example: 'Ducks group' })
  description: string;
}
