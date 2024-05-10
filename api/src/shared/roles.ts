import { Role } from './enums/role.enum';

export const RolesOrder = [
  Role.SuperAdmin,
  Role.Admin,
  Role.Reviewer,
  Role.Staff,
  Role.User,
];

export function compareRoles(a: Role, b: Role): number {
  return RolesOrder.indexOf(a) - RolesOrder.indexOf(b);
}

export function sortRoles(roles: Role[]): Role[] {
  return roles.sort((a, b) => compareRoles(a, b));
}
