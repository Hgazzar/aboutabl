/**
 * Resolve an API storage path (photo, worksheet file, thumbnail) to a usable URL.
 * Empty / storage-root / backend logo fallback → null (caller shows default).
 */
export function resolveStorageUrl(
  value?: string | null
): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.endsWith("/storage/") ||
    trimmed.endsWith("/storage") ||
    trimmed.includes("images/logo/site_logo")
  ) {
    return null;
  }

  const apiBase = (process.env.REACT_APP_BASE_URL || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    if (!apiBase || trimmed.startsWith("data:")) {
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/storage/")) {
        return `${apiBase}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  const path = trimmed.replace(/^\/+/, "");
  const withStorage = path.startsWith("storage/") ? path : `storage/${path}`;

  if (!apiBase) {
    return `/${withStorage}`;
  }

  return `${apiBase}/${withStorage}`;
}

export function resolveSubjectPhotoUrl(
  photo?: string | null
): string | null {
  return resolveStorageUrl(photo);
}
