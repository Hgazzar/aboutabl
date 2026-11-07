import Cookies from "js-cookie";
import { persistLoginUser, readPersistedLoginUser } from "./authSession";

export type StaffHandoffSession = {
  token: string;
  remember: boolean;
  user: Record<string, unknown>;
};

/** Same-origin only (admin :3000) — survives React Strict Mode remount after hash is cleared. */
const HANDOFF_STORAGE_KEY = "aboutabl_staff_handoff";

function decodeJwtPayload(token: string): {
  exp?: number;
  sub?: string | number;
} {
  const payloadBase64 = token.split(".")[1];
  if (!payloadBase64) {
    throw new Error("invalid token");
  }
  const padded =
    payloadBase64.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (payloadBase64.length % 4)) % 4);
  return JSON.parse(atob(padded)) as { exp?: number; sub?: string | number };
}

function applyStaffSession(args: {
  token: string;
  remember: boolean;
  username?: string;
  userId?: string;
  type?: string;
  schoolId?: string;
}): StaffHandoffSession | null {
  let payload: { exp?: number; sub?: string | number };
  try {
    payload = decodeJwtPayload(args.token);
  } catch {
    return null;
  }

  const cookieOptions = args.remember ? { expires: 7 } : {};
  const userId =
    (args.userId && String(args.userId)) ||
    (payload.sub != null ? String(payload.sub) : "");
  const username = args.username?.trim() || "";
  const type = args.type?.trim() || "admin";
  const schoolIdNum = args.schoolId ? Number(args.schoolId) : 0;
  const previous = readPersistedLoginUser();

  Cookies.set("token_", args.token, cookieOptions);
  if (payload.exp) {
    Cookies.set("expiration", String(payload.exp * 1000), cookieOptions);
  }
  if (userId) {
    Cookies.set("abotable_id", userId, cookieOptions);
  }
  if (username) {
    Cookies.set("username", username, cookieOptions);
  }
  if (type) {
    Cookies.set("abotable_type", type, cookieOptions);
  }

  const user: Record<string, unknown> = {
    ...(previous && String(previous.id) === String(userId) ? previous : {}),
    id: userId || undefined,
    username: username || previous?.username || undefined,
    type,
    api_token: args.token,
  };

  if (schoolIdNum > 0) {
    user.school_id = schoolIdNum;
    user.school = [{ id: schoolIdNum }];
  }

  persistLoginUser(user);

  try {
    sessionStorage.setItem(
      HANDOFF_STORAGE_KEY,
      JSON.stringify({
        token: args.token,
        remember: args.remember,
        username,
        userId,
        type,
        schoolId: schoolIdNum > 0 ? String(schoolIdNum) : undefined,
      })
    );
  } catch {
    /* ignore */
  }

  return { token: args.token, remember: args.remember, user };
}

function consumeStaffHandoffFromStorage(): StaffHandoffSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      token?: string;
      remember?: boolean;
      username?: string;
      userId?: string;
      type?: string;
      schoolId?: string;
    };
    if (!data?.token) {
      sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
      return null;
    }
    return applyStaffSession({
      token: String(data.token),
      remember: Boolean(data.remember),
      username: data.username,
      userId: data.userId,
      type: data.type,
      schoolId: data.schoolId,
    });
  } catch {
    try {
      sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function consumeStaffHandoffFromHash(): StaffHandoffSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash?.replace(/^#/, "") ?? "";
  if (!raw.includes("access_token=")) return null;

  const params = new URLSearchParams(raw);
  const token = params.get("access_token")?.trim();
  if (!token) return null;

  const session = applyStaffSession({
    token,
    remember: params.get("remember") === "1",
    username: params.get("username")?.trim() || undefined,
    userId: params.get("user_id")?.trim() || undefined,
    type: params.get("type")?.trim() || undefined,
    schoolId: params.get("school_id")?.trim() || undefined,
  });

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", cleanUrl);

  return session;
}

function hasFreshStaffCookieSession(): StaffHandoffSession | null {
  const token = Cookies.get("token_");
  const expiration = Cookies.get("expiration");
  if (!token || !expiration || +expiration < Date.now()) {
    return null;
  }

  // Prefer persisted login payload (includes type + school) so revisiting "/"
  // does not wipe teacher identity and fall back to admin SideNav.
  const persisted = readPersistedLoginUser();
  const cookieId = Cookies.get("abotable_id");
  const cookieUsername = Cookies.get("username");

  return {
    token,
    remember: false,
    user: {
      ...(persisted ?? {}),
      id: cookieId || persisted?.id,
      username: cookieUsername || persisted?.username,
      api_token: token,
      // Never drop role on cookie revisit — missing type would paint admin chrome.
      type: persisted?.type ?? Cookies.get("abotable_type") ?? undefined,
    },
  };
}

/**
 * Hash (from student SPA) → sessionStorage on admin origin (Strict Mode safe) → cookies.
 */
export function consumeStaffHandoff(): StaffHandoffSession | null {
  return (
    consumeStaffHandoffFromHash() ||
    consumeStaffHandoffFromStorage() ||
    hasFreshStaffCookieSession()
  );
}

/** Clear one-time handoff stash after dashboard mount. */
export function clearStaffHandoffStorage(): void {
  try {
    sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
