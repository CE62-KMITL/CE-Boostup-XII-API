import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { Role } from './enums/role.enum';

export async function getUserIdTracker(
  req: AuthenticatedRequest,
): Promise<string> {
  return req.user.id;
}

export function skipIfPublicOrSuperAdmin(context: ExecutionContext): boolean {
  const { user } = context.switchToHttp().getRequest();
  if (!user || user.roles.includes(Role.SuperAdmin)) {
    return true;
  }
  return false;
}
