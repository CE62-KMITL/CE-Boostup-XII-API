import { IsEmail, IsUrl } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;

  @IsUrl()
  siteUrl: string;
}
