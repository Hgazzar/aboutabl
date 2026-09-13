/**
 * Shared public auth lives on the student SPA (Welcome Back + landing).
 * Admin/teacher logout and expired sessions must leave the deprecated admin login.
 */

export function studentAppBaseUrl(): string {
  const fromEnv = process.env.REACT_APP_STUDENT_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:5173";
  }
  return "https://student.aboutabl.com";
}

/** Canonical post-logout / unauthenticated destination (new login, not landing). */
export function studentAppLoginUrl(): string {
  return `${studentAppBaseUrl()}/login`;
}

export function redirectToStudentLogin(): void {
  window.location.replace(studentAppLoginUrl());
}
