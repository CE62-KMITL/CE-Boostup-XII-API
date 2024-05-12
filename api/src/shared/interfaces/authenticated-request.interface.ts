import { Request } from 'express';
import { Role } from 'src/shared/enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  roles: Role[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
