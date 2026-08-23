import {
  CAMPUSES,
  PROGRAMS,
  cycleFromRange,
  cycleLengthWeeks,
  type Campus,
  type Cycle,
  type LeaderboardData,
  type Program,
  type Sponsor,
  type StudentRecord,
} from "./leaderboard";

export {
  DUMMY_ADMIN_EMAIL,
  DUMMY_ADMIN_PIN,
  composeStudents,
  dummyTickets,
  pullCycleTotals,
  verifyAdminLogin,
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
  lastPull?: { start: string; end: string; ticketCount: number; at: string };
  savedAt?: string;
};

export function readAdminSession() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function writeAdminSession(signedIn: boolean) {
  if (signedIn) window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  else window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
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
        CAMPUSES.includes(campus as Campus),
      ),
      optIn: parsed.optIn && typeof parsed.optIn === "object" ? parsed.optIn : {},
      addedStudents: Array.isArray(parsed.addedStudents) ? parsed.addedStudents : [],
      cycleTotals: parsed.cycleTotals && typeof parsed.cycleTotals === "object" ? parsed.cycleTotals : {},
      highFiveCutoff: Math.min(20, Math.max(1, Math.floor(parsed.highFiveCutoff ?? 5) || 5)),
      pageHoldSeconds: Math.min(60, Math.max(3, Math.floor(parsed.pageHoldSeconds ?? 7) || 7)),
      allTimeAfterSeconds: Math.min(300, Math.max(15, Math.floor(parsed.allTimeAfterSeconds ?? 60) || 60)),
      forceSlide: parsed.forceSlide ?? "auto",
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

export function tvStatusLine(store: AdminStore) {
  const slide =
    store.forceSlide === "auto"
      ? "auto-rotate (North → South → All Institute, then All-Time)"
      : store.forceSlide === "allTime"
        ? "forced All-Time"
        : store.forceSlide === "institute"
          ? "forced All Institute"
          : store.forceSlide === "north"
            ? "forced North Austin Campus"
            : "forced South Austin Campus";
  const motion = store.paused ? "paused" : "running";
  const ticker = store.tickerEnabled ? "ticker on" : "ticker off";
  return `${slide} · ${motion} · ${ticker}`;
}
