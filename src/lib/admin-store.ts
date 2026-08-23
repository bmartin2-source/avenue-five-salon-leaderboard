import {
  CAMPUS_LABELS,
  CAMPUSES,
  PROGRAMS,
  clampTypeStep,
  cycleFromRange,
  cycleLengthWeeks,
  isQuietHours,
  snapshotFrozenRanks,
  type Campus,
  type Cycle,
  type FreezeScope,
  type KioskPin,
  type LeaderboardData,
  type Program,
  type QuietDisplay,
  type Sponsor,
  type StaffSession,
  type StudentRecord,
  type TvTypeStep,
} from "./leaderboard";

export {
  DUMMY_ADMIN_EMAIL,
  DUMMY_ADMIN_PIN,
  DUMMY_CAMPUS_PIN,
  DUMMY_NORTH_EMAIL,
  DUMMY_SOUTH_EMAIL,
  DUMMY_STAFF,
  composeStudents,
  dummyTickets,
  isQuietHours,
  pullCycleTotals,
  ranksFrozenFor,
  snapshotFrozenRanks,
  verifyAdminLogin,
  verifyStaffLogin,
} from "./leaderboard";

export const ADMIN_STORE_KEY = "afi-highfive-dummy-admin";
export const ADMIN_SESSION_KEY = "afi-highfive-dummy-admin-session";
export const ADMIN_EVENT = "afi-admin-updated";

export type TvSlideKey = "auto" | "north" | "south" | "institute" | "allTime";

export type TickerItem = Sponsor & { enabled: boolean };

export type AdminStore = {
  cycleStart: string;
  cycleEnd: string;
  highFiveCutoff: number;
  pageHoldSeconds: number;
  allTimeAfterSeconds: number;
  tickerEnabled: boolean;
  sponsors: TickerItem[];
  hiddenPrograms: Program[];
  hiddenCampuses: Campus[];
  forceSlide: TvSlideKey;
  paused: boolean;
  optIn: Record<string, boolean>;
  addedStudents: StudentRecord[];
  cycleTotals: Record<string, { service: number; retail: number }>;
  cycleCleared: boolean;
  careerCleared: boolean;
  hiddenStudentIds: string[];
  boardHidden: boolean;
  frozenScopes: FreezeScope[];
  frozenRanks: Record<string, string[]>;
  kioskPin: KioskPin;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  quietDisplay: QuietDisplay;
  typeStep: TvTypeStep;
  lastPull?: { start: string; end: string; ticketCount: number; at: string };
  savedAt?: string;
};

function isCampus(value: unknown): value is Campus {
  return CAMPUSES.includes(value as Campus);
}

function isFreezeScope(value: unknown): value is FreezeScope {
  return value === "all" || isCampus(value);
}

function isKioskPin(value: unknown): value is KioskPin {
  return value === "institute" || isCampus(value);
}

function isQuietDisplay(value: unknown): value is QuietDisplay {
  return value === "branding" || value === "last";
}

function parseClock(value: unknown, fallback: string) {
  const raw = String(value ?? "");
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
}

export function parseStaffSession(raw: string | null): StaffSession | null {
  if (!raw) return null;
  if (raw === "1") {
    return { role: "institute-admin", email: "admin@avenuefive.com" };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StaffSession>;
    if (parsed.role === "institute-admin") {
      return { role: "institute-admin", email: parsed.email || "admin@avenuefive.com" };
    }
    if (parsed.role === "campus-manager" && isCampus(parsed.campus)) {
      return { role: "campus-manager", campus: parsed.campus, email: parsed.email || "" };
    }
  } catch {
    return null;
  }
  return null;
}

export function readStaffSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  return parseStaffSession(window.sessionStorage.getItem(ADMIN_SESSION_KEY));
}

export function writeStaffSession(session: StaffSession | null) {
  if (!session) window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  else window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function readAdminSession() {
  return readStaffSession() != null;
}

export function writeAdminSession(signedIn: boolean) {
  if (!signedIn) writeStaffSession(null);
  else writeStaffSession({ role: "institute-admin", email: "admin@avenuefive.com" });
}

export function staffIsInstitute(session: StaffSession | null) {
  return session?.role === "institute-admin";
}

export function staffCampus(session: StaffSession | null): Campus | undefined {
  return session?.role === "campus-manager" ? session.campus : undefined;
}

export function defaultAdminStore(seed: LeaderboardData): AdminStore {
  const cycle = seed.cycle;
  return {
    cycleStart: cycle.startDate,
    cycleEnd: cycle.endDate,
    highFiveCutoff: 5,
    pageHoldSeconds: 7,
    allTimeAfterSeconds: 60,
    tickerEnabled: true,
    sponsors: seed.sponsors.map((sponsor) => ({ ...sponsor, enabled: true })),
    hiddenPrograms: [],
    hiddenCampuses: [],
    forceSlide: "auto",
    paused: false,
    optIn: {},
    addedStudents: [],
    cycleTotals: {},
    cycleCleared: false,
    careerCleared: false,
    hiddenStudentIds: [],
    boardHidden: false,
    frozenScopes: [],
    frozenRanks: {},
    kioskPin: "institute",
    quietHoursEnabled: false,
    quietStart: "21:00",
    quietEnd: "07:00",
    quietDisplay: "branding",
    typeStep: 0,
  };
}

export function readAdminStore(seed: LeaderboardData): AdminStore {
  const fallback = defaultAdminStore(seed);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(ADMIN_STORE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AdminStore>;
    return {
      ...fallback,
      ...parsed,
      sponsors: Array.isArray(parsed.sponsors) && parsed.sponsors.length
        ? parsed.sponsors.map((sponsor, index) => ({
            id: sponsor.id || `s${index + 1}`,
            name: sponsor.name || "Untitled",
            line: sponsor.line || "",
            enabled: sponsor.enabled !== false,
          }))
        : fallback.sponsors,
      hiddenPrograms: (parsed.hiddenPrograms ?? []).filter((program): program is Program =>
        PROGRAMS.includes(program as Program),
      ),
      hiddenCampuses: (parsed.hiddenCampuses ?? []).filter((campus): campus is Campus =>
        isCampus(campus),
      ),
      optIn: parsed.optIn && typeof parsed.optIn === "object" ? parsed.optIn : {},
      addedStudents: Array.isArray(parsed.addedStudents) ? parsed.addedStudents : [],
      cycleTotals: parsed.cycleTotals && typeof parsed.cycleTotals === "object" ? parsed.cycleTotals : {},
      hiddenStudentIds: Array.isArray(parsed.hiddenStudentIds)
        ? parsed.hiddenStudentIds.filter((id): id is string => typeof id === "string")
        : [],
      frozenScopes: (parsed.frozenScopes ?? []).filter(isFreezeScope),
      frozenRanks:
        parsed.frozenRanks && typeof parsed.frozenRanks === "object" ? parsed.frozenRanks : {},
      highFiveCutoff: Math.min(20, Math.max(1, Math.floor(parsed.highFiveCutoff ?? 5) || 5)),
      pageHoldSeconds: Math.min(60, Math.max(3, Math.floor(parsed.pageHoldSeconds ?? 7) || 7)),
      allTimeAfterSeconds: Math.min(300, Math.max(15, Math.floor(parsed.allTimeAfterSeconds ?? 60) || 60)),
      forceSlide: parsed.forceSlide ?? "auto",
      boardHidden: parsed.boardHidden === true,
      kioskPin: isKioskPin(parsed.kioskPin) ? parsed.kioskPin : "institute",
      quietHoursEnabled: parsed.quietHoursEnabled === true,
      quietStart: parseClock(parsed.quietStart, "21:00"),
      quietEnd: parseClock(parsed.quietEnd, "07:00"),
      quietDisplay: isQuietDisplay(parsed.quietDisplay) ? parsed.quietDisplay : "branding",
      typeStep: clampTypeStep(parsed.typeStep),
    };
  } catch {
    return fallback;
  }
}

export function writeAdminStore(store: AdminStore) {
  const next = { ...store, savedAt: new Date().toISOString() };
  window.localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ADMIN_EVENT));
  return next;
}

export function adminCycle(store: AdminStore): Cycle {
  const cycle = cycleFromRange(store.cycleStart, store.cycleEnd);
  return { ...cycle, weeks: cycleLengthWeeks(store.cycleStart, store.cycleEnd) };
}

export function liveSponsors(store: AdminStore) {
  if (!store.tickerEnabled) return [];
  return store.sponsors.filter((sponsor) => sponsor.enabled);
}

export function visiblePrograms(store: AdminStore) {
  const shown = PROGRAMS.filter((program) => !store.hiddenPrograms.includes(program));
  return shown.length ? shown : PROGRAMS;
}

export function visibleCampuses(store: AdminStore) {
  const shown = CAMPUSES.filter((campus) => !store.hiddenCampuses.includes(campus));
  return shown.length ? shown : CAMPUSES;
}

export function freezeStore(
  store: AdminStore,
  students: StudentRecord[],
  scopes: FreezeScope[],
): AdminStore {
  const unique = [...new Set([...store.frozenScopes, ...scopes])];
  return {
    ...store,
    frozenScopes: unique,
    frozenRanks: { ...store.frozenRanks, ...snapshotFrozenRanks(students, scopes) },
  };
}

export function unfreezeStore(store: AdminStore, scopes: FreezeScope[]): AdminStore {
  if (scopes.includes("all") || scopes.length === 0) {
    return { ...store, frozenScopes: [], frozenRanks: {} };
  }
  const remaining = store.frozenScopes.filter((scope) => !scopes.includes(scope));
  if (remaining.length === 0) {
    return { ...store, frozenScopes: [], frozenRanks: {} };
  }
  const frozenRanks = { ...store.frozenRanks };
  for (const scope of scopes) {
    if (scope === "all") continue;
    for (const program of PROGRAMS) {
      delete frozenRanks[`cycle:${scope}:${program}`];
    }
  }
  return { ...store, frozenScopes: remaining, frozenRanks };
}

export function toggleHiddenStudent(store: AdminStore, studentId: string): AdminStore {
  const hidden = store.hiddenStudentIds.includes(studentId);
  return {
    ...store,
    hiddenStudentIds: hidden
      ? store.hiddenStudentIds.filter((id) => id !== studentId)
      : [...store.hiddenStudentIds, studentId],
  };
}

export function tvMotionHalted(store: AdminStore, now = new Date()) {
  return (
    store.paused ||
    store.boardHidden ||
    isQuietHours(now, store.quietStart, store.quietEnd, store.quietHoursEnabled)
  );
}

export function tvStatusLine(
  store: AdminStore,
  now = new Date(),
  session?: StaffSession | null,
) {
  const managerCampus = session?.role === "campus-manager" ? session.campus : undefined;
  const slide = managerCampus
    ? store.kioskPin === managerCampus
      ? `kiosk pinned to ${CAMPUS_LABELS[managerCampus]}`
      : store.forceSlide === managerCampus
        ? `forced ${CAMPUS_LABELS[managerCampus]}`
        : `${CAMPUS_LABELS[managerCampus]} board`
    : store.forceSlide === "auto"
      ? store.kioskPin === "institute"
        ? "auto-rotate (North → South → All Institute, then All-Time)"
        : `kiosk pinned to ${store.kioskPin === "north" ? "North Austin Campus" : "South Austin Campus"}`
      : store.forceSlide === "allTime"
        ? "forced All-Time"
        : store.forceSlide === "institute"
          ? "forced All Institute"
          : store.forceSlide === "north"
            ? "forced North Austin Campus"
            : "forced South Austin Campus";
  const quiet = isQuietHours(now, store.quietStart, store.quietEnd, store.quietHoursEnabled);
  const motion = store.boardHidden
    ? "board hidden"
    : quiet
      ? `quiet hours (${store.quietDisplay})`
      : store.paused
        ? "paused"
        : "running";
  const frozen = managerCampus
    ? store.frozenScopes.includes("all") || store.frozenScopes.includes(managerCampus)
      ? "ranks frozen"
      : "live ranks"
    : store.frozenScopes.length
      ? store.frozenScopes.includes("all")
        ? "ranks frozen"
        : `ranks frozen (${store.frozenScopes.join(", ")})`
      : "live ranks";
  const ticker = store.tickerEnabled ? "ticker on" : "ticker off";
  return `${slide} · ${motion} · ${frozen} · ${ticker}`;
}
