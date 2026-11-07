import { getRequest } from "./fetchMethods";
import { persistLoginUser } from "./authSession";

/**
 * LoginAdminResource exposes `school` (array), not always `school_id`.
 * Staff handoff often only has token + type until we hydrate from `/api/school/get`.
 */
export function resolveSchoolId(
  user: Record<string, unknown> | null | undefined
): number {
  const direct = Number(user?.school_id ?? 0);
  if (direct > 0) {
    return direct;
  }

  const schools = user?.school;
  if (Array.isArray(schools) && schools.length > 0) {
    const first = schools[0] as { id?: number | string };
    const fromList = Number(first?.id ?? 0);
    if (fromList > 0) {
      return fromList;
    }
  }

  if (schools && typeof schools === "object" && !Array.isArray(schools)) {
    const single = Number((schools as { id?: number | string }).id ?? 0);
    if (single > 0) {
      return single;
    }
  }

  return 0;
}

function mergeSchoolIntoUser(
  user: Record<string, unknown>,
  schools: Array<{ id?: number | string }>
): Record<string, unknown> {
  const firstId = Number(schools[0]?.id ?? 0);
  const next: Record<string, unknown> = {
    ...user,
    school: schools,
  };
  if (firstId > 0) {
    next.school_id = firstId;
  }
  persistLoginUser(next);
  return next;
}

/**
 * If the login user has no school context, load assigned schools from the API
 * (same source as full admin login: Schools() via `/api/school/get`).
 */
export async function hydrateLoginUserSchool(
  user: Record<string, unknown> | null | undefined
): Promise<Record<string, unknown>> {
  if (!user?.id) {
    return user ?? {};
  }

  if (resolveSchoolId(user) > 0) {
    return user;
  }

  try {
    const result = await getRequest({}, "/api/school/get");
    const schools = result?.schools;
    if (Array.isArray(schools) && schools.length > 0) {
      return mergeSchoolIntoUser(user, schools);
    }
  } catch {
    /* keep original user — wizard will still surface school error */
  }

  return user;
}
