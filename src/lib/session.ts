export const SESSION_KEY = "afi-highfive-dummy-session";
export const CONSENT_KEY = "afi-highfive-dummy-consent";

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

export function readConsentOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeConsent(studentId: string, optedIn: boolean) {
  const next = { ...readConsentOverrides(), [studentId]: optedIn };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
}
