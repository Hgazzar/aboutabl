/**
 * NOTIF-001 Phase 4 — Teacher/Admin notification URL navigation helpers.
 * Consumes Phase-2 normalized URLs; does not invent alternate routes.
 */

export type StaffNotificationItem = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  is_read?: string | number | boolean | null;
  url?: string | null;
  from_id?: number | string | null;
  name?: string | null;
  photo?: string | null;
};

export function isStaffNotificationUnread(item: {
  is_read?: string | number | boolean | null;
}): boolean {
  return item?.is_read === "0" || item?.is_read === 0 || item?.is_read === false;
}

export function countStaffUnreadNotifications(
  items: Array<{ is_read?: string | number | boolean | null }> | null | undefined
): number {
  if (!items?.length) return 0;
  return items.filter((item) => isStaffNotificationUnread(item)).length;
}

export type StaffNotificationNavTarget =
  | { kind: "internal"; path: string }
  | { kind: "external"; href: string }
  | { kind: "none" };

export function resolveStaffNotificationNavTarget(
  rawUrl: string | null | undefined,
  currentOrigin?: string
): StaffNotificationNavTarget {
  if (rawUrl == null) return { kind: "none" };
  const url = String(rawUrl).trim();
  if (!url || url === "null" || url === "undefined") return { kind: "none" };

  try {
    // Protocol-relative must not be treated as an SPA path (open-redirect).
    const absoluteCandidate = url.startsWith("//") ? `https:${url}` : url;

    if (/^https?:\/\//i.test(absoluteCandidate)) {
      const parsed = new URL(absoluteCandidate);
      const origin =
        currentOrigin ??
        (typeof window !== "undefined" ? window.location.origin : undefined);
      if (origin && parsed.origin === origin) {
        return {
          kind: "internal",
          path: `${parsed.pathname}${parsed.search}${parsed.hash}`,
        };
      }
      return { kind: "external", href: absoluteCandidate };
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
      return { kind: "none" };
    }

    const path = url.startsWith("/") ? url : `/${url}`;
    return { kind: "internal", path };
  } catch {
    return { kind: "none" };
  }
}

export function openStaffNotificationNavTarget(
  navigate: (to: string) => void,
  rawUrl: string | null | undefined,
  openExternal: (href: string) => void = (href) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }
): void {
  const target = resolveStaffNotificationNavTarget(rawUrl);
  if (target.kind === "internal") {
    navigate(target.path);
    return;
  }
  if (target.kind === "external") {
    openExternal(target.href);
  }
}
