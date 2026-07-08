import Cookies from "js-cookie";

const STORAGE_KEY = "aboutabl_login_user";

export function persistLoginUser(user: Record<string, unknown> | null | undefined) {
  if (!user?.id) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function readPersistedLoginUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw) as Record<string, unknown>;
    const cookieId = Cookies.get("abotable_id");

    if (cookieId && String(user.id) !== String(cookieId)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function clearPersistedLoginUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getEffectiveLoginUser(
  reduxUser: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (reduxUser?.id) {
    return reduxUser;
  }

  return readPersistedLoginUser() ?? {};
}

export function isTeacherUser(user: Record<string, unknown> | null | undefined) {
  return Boolean(user?.type && user.type !== "admin");
}
