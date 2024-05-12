import { Role } from '../shared/enums/role.enum';

export const RolesValue = {
  [Role.SuperAdmin]: 0,
  [Role.Admin]: 1,
  [Role.Reviewer]: 2,
  [Role.Staff]: 2,
  [Role.User]: 3,
};

export function getRoleValue(role: Role): number {
  return RolesValue[role];
}

export function isRoleHigher(role: Role, target: Role): boolean {
  if (role === Role.SuperAdmin) {
    return true;
  }
  return getRoleValue(role) < getRoleValue(target);
}

export function isRolesHigher(roles: Role[], target: Role[]): boolean {
  return roles.some((role) =>
    target.every((targetRole) => isRoleHigher(role, targetRole)),
  );
}

export function isRoleAtLeast(role: Role, target: Role): boolean {
  if (role === Role.SuperAdmin) {
    return true;
  }
  return getRoleValue(role) <= getRoleValue(target);
}

export function isRolesAtLeast(roles: Role[], target: Role[]): boolean {
  return roles.some((role) =>
    target.every((targetRole) => isRoleAtLeast(role, targetRole)),
  );
}

export function isSomeRolesIn(roles: Role[], target: Role[]): boolean {
  return roles.some((role) => target.includes(role));
}
