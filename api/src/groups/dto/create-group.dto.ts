import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class CreateGroupDto {
  @ApiProperty({
    type: 'string',
    minLength: ConfigConstants.group.minNameLength,
    maxLength: ConfigConstants.group.maxNameLength,
    example: 'Ducks',
  })
  @IsString()
  @MinLength(ConfigConstants.group.minNameLength)
  @MaxLength(ConfigConstants.group.maxNameLength)
  name: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.group.maxDescriptionLength,
    example: 'Ducks group',
  })
  @IsString()
  @MaxLength(ConfigConstants.group.maxDescriptionLength)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAC/klEQVQ4y4WTXUxbZRzGf+/p6aErHyudNJQKBsaQijKnN1vi/EZ08wKNYZkxcZF4w3DRmGjiMk0wkt0YZ7hwJsSAH7twGkzMwo1GXMjcIlMKq1uZJWEFy4AU2pVCz3nP+3pBsrjM6O/un+ef57l5HvT/oZS+fCWppZT/Kpv8B0ODX/DCvha+/T5Bem0aNLz/+m4qA4GbP0JrrQFs28ayLABmk5PI5WlsV1PXuB2A3s8XEVY5Wmv2Nps8274bAAPg+kKaTOoC+esX+eXyDOl1L/NL68Tm7JtJLf4p3tiv2BbeRnylgonxMQBMAKWhoryUZMaHKObwj7+NdGsov+Nhro19SUnuLA/5YfYPL23hWi5dukJd6IlNA6UUf549xcy5UWqjLUTkGRCCkEjjpIoY5hSOECgNVlASqQ1THQ6hNEwmZjEGuttZW17kwQOHqFwYxlm1WVuPsOLeT1XL4zhZG2e1SH61jGDDTvx+H6bpwXVdkiqE8VfgXj4dmeRY3wCsbSBvbCDLouQKJThFe/O+UaTQ+ByWz+KlV44yODSMEGBaPoyyXR24SrPUUMVkcw+yKPEkvia4MIL6sQ+54SI3HErPn+DiR4dZjlTS0fEkA4PfYWfmMHLFecZ3NOKrCBBLxfhwy2MoCa6EoWgX/a2HiJfuZDjdxMtb2qm7swb7wjvE7/KTtQuIxMxVffDkcU5HJ4hlq/lA3YevTIFTgdcC4RjYWmNLhyPFCeqNRabtMF+FdvHeA22YTfWNOKEw9sp57vHM8oi1h+ZgJSeuXmOPWqc+P4dXCe72LlFu5LEoEJUZns6WsLfr6GYPRl7s5mT/PBEjz7uHn8L0eGj47TO+kU0EhUOMKqKrcVJGNb1Vz2D5DU7t77y1yiM/j/La2A9I5dBrTXHMbsVrClwXTMPkp842YskUR35N8OaOKN0HDt5qAJDNZWn9uA+vaXA8M8pbgUfRSoAADwZKa8Ze7aGmOnz7mP5JoVDgk+HT9Md/RxgeurY30/N8J4GtW29b7N+AcIVs/VCRxQAAAABJRU5ErkJggg==',
  })
  @Matches(
    /^data:image\/(?:png|jpg|jpeg|webp|avif|gif|bmp);base64,((?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?)$/,
    { message: 'Invalid base64 image' },
  )
  @IsOptional()
  avatar?: string;
}
