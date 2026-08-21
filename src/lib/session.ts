export const SESSION_KEY = "afi-salon-dummy-session";

export function readSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

export function writeSession(studentId: string) {
  window.sessionStorage.setItem(SESSION_KEY, studentId);
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
}
