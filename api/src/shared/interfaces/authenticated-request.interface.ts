import { Role } from 'src/shared/enums/role.enum';

export interface AuthenticatedRequest {
  user: { id: string; roles: Role[] };
}
