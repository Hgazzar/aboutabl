/**
 * Returns true when the current user has add-teachers but NOT add-users,
 * so they can only add teachers and must not see the role dropdown.
 */
export function canOnlyAddTeachers(permissionsState: {
  permissions?: {
    teachers?: Array<Record<string, string>>;
    users?: Array<Record<string, string>>;
  };
}): boolean {
  const teachers = permissionsState?.permissions?.teachers;
  const users = permissionsState?.permissions?.users;
  const hasAddTeachers = teachers?.some((p) => p["add-teachers"] === "1");
  const hasAddUsers = users?.some((p) => p["add-users"] === "1");
  return Boolean(hasAddTeachers && !hasAddUsers);
}

/**
 * Resolve teacher role id from role list.
 * roleList can be the roles array, or { roles: array } or { data: array } (e.g. from common.roleList).
 */
export function getTeacherRoleId(roleList: any): string | number | null {
  const roles = Array.isArray(roleList)
    ? roleList
    : roleList?.roles ?? roleList?.data;
  if (!roles || !Array.isArray(roles)) return null;
  const teacher = roles.find(
    (r: any) => String(r?.name || "").toLowerCase() === "teacher"
  );
  return teacher?.id ?? null;
}
