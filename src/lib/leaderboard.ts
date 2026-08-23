export const PROGRAMS = [
  "cosmetology",
  "barbering",
  "esthetics",
  "nailTechnology",
] as const;

export const CLASS_START_DATES = [
  "2026-07-20",
  "2026-08-31",
  "2026-10-19",
  "2026-11-30",
] as const;

export const CAMPUSES = ["north", "south"] as const;

export type Program = (typeof PROGRAMS)[number];
export type Campus = (typeof CAMPUSES)[number];

export type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  lastInitial: string;
  optedIn: boolean;
  program: Program;
  campus: Campus;
  service: number;
  retail: number;
  careerService: number;
  careerRetail: number;
  startedOn: string;
  previousRank?: number;
};

export type ScoreKind = "cycle" | "career";

export const PROGRAM_LENGTH_MONTHS: Record<Program, number> = {
  cosmetology: 9,
  barbering: 8,
  esthetics: 6.75,
  nailTechnology: 5,
};

export const HIGH_FIVE_SIZE = 5;
export const SERVICE_POINTS_PER_DOLLAR = 1;
export const RETAIL_POINTS_PER_DOLLAR = 5;

export type Sponsor = {
  id: string;
  name: string;
  line: string;
};

export type Cycle = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  weeks: number;
  note: string;
};

export type LeaderboardData = {
  meta: { dummy: boolean; notice: string };
  institute: { name: string; shortName: string };
  asOf?: string;
  classStarts?: string[];
  cycle: Cycle;
  sponsors: Sponsor[];
  students: StudentRecord[];
};

export type RankedStudent = StudentRecord & {
  points: number;
  total: number;
  rank: number;
  campusRank: number;
  previousRank: number;
  rankDelta: number;
  displayName: string;
  highFive: boolean;
  allTime: boolean;
  scoreKind: ScoreKind;
};

export type BoardScope = {
  program: Program;
  campus?: Campus;
  score?: ScoreKind;
  highFiveSize?: number;
};

export const PROGRAM_LABELS: Record<Program, string> = {
  cosmetology: "Cosmetology",
  barbering: "Barbering",
  esthetics: "Esthetics",
  nailTechnology: "Nail Technology",
};

export const CAMPUS_LABELS: Record<Campus, string> = {
  north: "North Austin Campus",
  south: "South Austin Campus",
};

export const CAMPUS_SHORT: Record<Campus, string> = {
  north: "N Austin",
  south: "S Austin",
};

export function studentDollarTotal(student: Pick<StudentRecord, "service" | "retail">): number {
  return student.service + student.retail;
}

/** Ranking score: 1 pt per $1 service, 5 pts per $1 retail. */
export function studentPoints(student: Pick<StudentRecord, "service" | "retail">): number {
  return (
    student.service * SERVICE_POINTS_PER_DOLLAR +
    student.retail * RETAIL_POINTS_PER_DOLLAR
  );
}

export function formatPoints(amount: number): string {
  return `${amount.toLocaleString("en-US")} pts`;
}

export function scoreDollars(
  student: StudentRecord,
  score: ScoreKind = "cycle",
): Pick<StudentRecord, "service" | "retail"> {
  if (score === "career") {
    return { service: student.careerService, retail: student.careerRetail };
  }
  return { service: student.service, retail: student.retail };
}

function compareByPoints(score: ScoreKind = "cycle") {
  return (a: StudentRecord, b: StudentRecord): number => {
    const pointDiff = studentPoints(scoreDollars(b, score)) - studentPoints(scoreDollars(a, score));
    if (pointDiff !== 0) return pointDiff;
    const left = scoreDollars(a, score);
    const right = scoreDollars(b, score);
    const retailDiff = right.retail - left.retail;
    if (retailDiff !== 0) return retailDiff;
    const serviceDiff = right.service - left.service;
    if (serviceDiff !== 0) return serviceDiff;
    return a.id.localeCompare(b.id);
  };
}

export function displayName(student: Pick<StudentRecord, "id" | "firstName" | "lastInitial" | "optedIn">): string {
  if (student.optedIn) {
    return `${student.firstName} ${student.lastInitial}.`;
  }
  return `Student ${student.id}`;
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export const TV_STAGE_WIDTH = 1920;
export const TV_STAGE_HEIGHT = 1080;
export const TV_ROW_HEIGHT = 50;

/** Uniform scale so a 1920×1080 TV stage fits any viewport without clipping a column. */
export function tvStageScale(viewportWidth: number, viewportHeight: number) {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  return Math.min(width / TV_STAGE_WIDTH, height / TV_STAGE_HEIGHT);
}

const MIN_LAST_PAGE_ROWS = 8;

/** Inclusive rank ranges for a TV column. Remainders of 1–7 stay on the previous page. */
export function tvPageRanges(length: number, maxPageSize: number): Array<[number, number]> {
  const max = Math.max(1, Math.floor(maxPageSize) || 1);
  if (length <= 0) return [[0, 0]];
  if (length <= max) return [[0, length]];
  const remainder = length % max;
  if (remainder > 0 && remainder < MIN_LAST_PAGE_ROWS) {
    const full = Math.floor(length / max);
    if (full <= 1) return [[0, length]];
    const ranges: Array<[number, number]> = [];
    let start = 0;
    for (let index = 0; index < full - 1; index += 1) {
      ranges.push([start, start + max]);
      start += max;
    }
    ranges.push([start, length]);
    return ranges;
  }
  const ranges: Array<[number, number]> = [];
  for (let start = 0; start < length; start += max) {
    ranges.push([start, Math.min(length, start + max)]);
  }
  return ranges;
}

/** @deprecated Use tvPageWindow. Kept so older callers still compile. */
export function balancedPageSize(length: number, maxPageSize: number) {
  const ranges = tvPageRanges(length, maxPageSize);
  return ranges.length <= 1 ? Math.max(length, maxPageSize) : maxPageSize;
}

/** TV list paging: which ranks belong on a page, wrapping in both directions. */
export function listPageWindow(length: number, pageSize: number, listPage: number) {
  const ranges = tvPageRanges(length, pageSize);
  const pageCount = Math.max(1, ranges.length);
  const page = ((listPage % pageCount) + pageCount) % pageCount;
  const [start, end] = ranges[page] ?? [0, 0];
  const size = Math.max(1, Math.floor(pageSize) || 1);
  return { page, pageCount, start, end, size };
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fridayBefore(isoDate: string): string {
  const date = parseIso(isoDate);
  const day = date.getDay();
  const daysSinceFriday = (day - 5 + 7) % 7;
  date.setDate(date.getDate() - (daysSinceFriday === 0 ? 7 : daysSinceFriday));
  return toIso(date);
}

export function cycleLengthWeeks(startDate: string, endDate: string): number {
  const days =
    Math.round((parseIso(endDate).getTime() - parseIso(startDate).getTime()) / 86_400_000) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function cycleForDate(
  today: Date,
  starts: readonly string[] = CLASS_START_DATES,
): Cycle {
  const todayIso = toIso(today);
  let start = starts[0];
  let next: string | undefined = starts[1];
  for (let index = 0; index < starts.length; index += 1) {
    if (starts[index] <= todayIso) {
      start = starts[index];
      next = starts[index + 1];
    }
  }
  const endDate = next ? fridayBefore(next) : start;
  const startLabel = parseIso(start).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  return {
    id: start,
    label: `${startLabel} start`,
    startDate: start,
    endDate,
    weeks: cycleLengthWeeks(start, endDate),
    note: "Cycle starts on a published class start date and ends the Friday before the next class start.",
  };
}

export function formatCycleRange(cycle: Cycle): string {
  const start = parseIso(cycle.startDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const end = parseIso(cycle.endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  return `${start} – ${end}`;
}

export function resolveCycle(board: LeaderboardData, today = new Date()): Cycle {
  const asOf = board.asOf ? parseIso(board.asOf) : today;
  const starts = board.classStarts?.length ? board.classStarts : CLASS_START_DATES;
  return cycleForDate(asOf, starts);
}

export function cycleWeek(cycle: Cycle, today = new Date()): number {
  const start = parseIso(cycle.startDate);
  const diff = today.getTime() - start.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(cycle.weeks, Math.max(1, week));
}

/** Dummy “today” shared by hub, TV, and student view so the week number matches. */
export const BOARD_AS_OF = "2026-08-21";

export function boardAsOfDate(asOf = BOARD_AS_OF): Date {
  return new Date(`${asOf}T12:00:00`);
}

export function displayCycleWeek(cycle: Cycle, asOf = BOARD_AS_OF): number {
  return cycleWeek(cycle, boardAsOfDate(asOf));
}

export function rankStudents(
  students: StudentRecord[],
  scope: BoardScope,
): RankedStudent[] {
  const score = scope.score ?? "cycle";
  const list = students
    .filter((student) => {
      if (student.program !== scope.program) return false;
      if (scope.campus && student.campus !== scope.campus) return false;
      return true;
    })
    .slice()
    .sort(compareByPoints(score));

  const campusRankById = campusProgramRanks(students, score);

  return list.map((student, index) => {
    const rank = index + 1;
    const dollars = scoreDollars(student, score);
    const previousRank = score === "career" ? rank : student.previousRank ?? rank;
    const campusRank = campusRankById.get(student.id) ?? rank;
    const points = studentPoints(dollars);
    return {
      ...student,
      points,
      total: points,
      rank,
      campusRank,
      previousRank,
      rankDelta: previousRank - rank,
      displayName: displayName(student),
      highFive: score === "cycle" && rank <= (scope.highFiveSize ?? HIGH_FIVE_SIZE),
      allTime: score === "career" && rank <= (scope.highFiveSize ?? HIGH_FIVE_SIZE),
      scoreKind: score,
    };
  });
}

function campusProgramRanks(students: StudentRecord[], score: ScoreKind = "cycle"): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const campus of CAMPUSES) {
    for (const program of PROGRAMS) {
      const list = students
        .filter((student) => student.campus === campus && student.program === program)
        .slice()
        .sort(compareByPoints(score));
      list.forEach((student, index) => ranks.set(student.id, index + 1));
    }
  }
  return ranks;
}

export function rankAllPrograms(
  students: StudentRecord[],
  campus?: Campus,
  score: ScoreKind = "cycle",
  highFiveSize = HIGH_FIVE_SIZE,
): Record<Program, RankedStudent[]> {
  return Object.fromEntries(
    PROGRAMS.map((program) => [
      program,
      rankStudents(students, { program, campus, score, highFiveSize }),
    ]),
  ) as Record<Program, RankedStudent[]>;
}

export function campusTotals(students: StudentRecord[], campus: Campus) {
  const subset = students.filter((student) => student.campus === campus);
  const byProgram = Object.fromEntries(
    PROGRAMS.map((program) => {
      const programStudents = subset.filter((student) => student.program === program);
      const service = programStudents.reduce((sum, student) => sum + student.service, 0);
      const retail = programStudents.reduce((sum, student) => sum + student.retail, 0);
      return [
        program,
        {
          service,
          retail,
          points: studentPoints({ service, retail }),
          total: service + retail,
          count: programStudents.length,
        },
      ];
    }),
  ) as Record<
    Program,
    { service: number; retail: number; points: number; total: number; count: number }
  >;

  const service = subset.reduce((sum, student) => sum + student.service, 0);
  const retail = subset.reduce((sum, student) => sum + student.retail, 0);
  return {
    campus,
    service,
    retail,
    points: studentPoints({ service, retail }),
    total: service + retail,
    count: subset.length,
    byProgram,
  };
}

export function findStudentByLogin(
  students: StudentRecord[],
  studentId: string,
  lastName: string,
): StudentRecord | null {
  const id = studentId.trim().toUpperCase();
  const name = lastName.trim().toLowerCase();
  const match = students.find((student) => student.id.toUpperCase() === id);
  if (!match || match.lastName.toLowerCase() !== name) return null;
  return match;
}

export function findStudent(
  students: StudentRecord[],
  studentId: string,
): StudentRecord | undefined {
  return students.find((student) => student.id.toUpperCase() === studentId.trim().toUpperCase());
}

export const DUMMY_ADMIN_EMAIL = "admin@avenuefive.com";
export const DUMMY_ADMIN_PIN = "2468";
export const DUMMY_NORTH_EMAIL = "north@avenuefive.com";
export const DUMMY_SOUTH_EMAIL = "south@avenuefive.com";
export const DUMMY_CAMPUS_PIN = "1357";

export type StaffRole = "institute-admin" | "campus-manager";
export type StaffSession = {
  role: StaffRole;
  campus?: Campus;
  email: string;
};
export type FreezeScope = "all" | Campus;
export type TvTypeStep = -1 | 0 | 1;
export type KioskPin = Campus | "institute";
export type QuietDisplay = "branding" | "last";

export const DUMMY_STAFF: Array<{
  email: string;
  pin: string;
  role: StaffRole;
  campus?: Campus;
}> = [
  { email: DUMMY_ADMIN_EMAIL, pin: DUMMY_ADMIN_PIN, role: "institute-admin" },
  { email: DUMMY_NORTH_EMAIL, pin: DUMMY_CAMPUS_PIN, role: "campus-manager", campus: "north" },
  { email: DUMMY_SOUTH_EMAIL, pin: DUMMY_CAMPUS_PIN, role: "campus-manager", campus: "south" },
];

export function verifyStaffLogin(email: string, pin: string): StaffSession | null {
  const match = DUMMY_STAFF.find(
    (row) => row.email === email.trim().toLowerCase() && row.pin === pin.trim(),
  );
  if (!match) return null;
  return { role: match.role, campus: match.campus, email: match.email };
}

export function verifyAdminLogin(email: string, pin: string) {
  return verifyStaffLogin(email, pin)?.role === "institute-admin";
}

export const TV_TYPE_STEPS: Record<
  TvTypeStep,
  { row: number; name: number; points: number; rankCol: number; pointsCol: number }
> = {
  [-1]: { row: 48, name: 22, points: 18, rankCol: 48, pointsCol: 96 },
  [0]: { row: 50, name: 24, points: 20, rankCol: 52, pointsCol: 102 },
  [1]: { row: 54, name: 26, points: 21, rankCol: 54, pointsCol: 110 },
};

export function clampTypeStep(value: unknown): TvTypeStep {
  const step = Number(value);
  if (step <= -1) return -1;
  if (step >= 1) return 1;
  return 0;
}

export function tvRowHeight(step: unknown = 0) {
  return TV_TYPE_STEPS[clampTypeStep(step)].row;
}

export function parseClockMinutes(hhmm: string) {
  const [hours, minutes] = String(hhmm || "").split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return ((Math.min(23, Math.max(0, hours)) * 60) + Math.min(59, Math.max(0, minutes))) % (24 * 60);
}

/** Inclusive start, exclusive end. Overnight windows (21:00–07:00) are supported. */
export function isQuietHours(
  now: Date,
  start: string,
  end: string,
  enabled: boolean,
) {
  if (!enabled) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const from = parseClockMinutes(start);
  const to = parseClockMinutes(end);
  if (from === to) return true;
  if (from < to) return mins >= from && mins < to;
  return mins >= from || mins < to;
}

export function freezeRankKey(
  score: ScoreKind,
  campus: Campus | "all",
  program: Program,
) {
  return `${score}:${campus}:${program}`;
}

export function ranksFrozenFor(
  scopes: FreezeScope[],
  campus?: Campus,
  allTime?: boolean,
) {
  if (!scopes.length) return false;
  if (scopes.includes("all")) return true;
  if (allTime) return false;
  return Boolean(campus && scopes.includes(campus));
}

export function snapshotFrozenRanks(
  students: StudentRecord[],
  scopes: FreezeScope[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const includeAll = scopes.includes("all");
  const campuses = includeAll
    ? [...CAMPUSES]
    : CAMPUSES.filter((campus) => scopes.includes(campus));

  for (const campus of campuses) {
    for (const program of PROGRAMS) {
      out[freezeRankKey("cycle", campus, program)] = rankStudents(students, {
        campus,
        program,
        score: "cycle",
      }).map((row) => row.id);
    }
  }

  if (includeAll) {
    for (const program of PROGRAMS) {
      out[freezeRankKey("cycle", "all", program)] = rankStudents(students, {
        program,
        score: "cycle",
      }).map((row) => row.id);
      out[freezeRankKey("career", "all", program)] = rankStudents(students, {
        program,
        score: "career",
      }).map((row) => row.id);
    }
  }
  return out;
}

export function applyFrozenOrder(
  students: StudentRecord[],
  frozenIds: string[] | undefined,
  scope: BoardScope,
): RankedStudent[] {
  if (!frozenIds?.length) return rankStudents(students, scope);
  const byId = new Map(students.map((student) => [student.id, student]));
  const ordered: StudentRecord[] = [];
  for (const id of frozenIds) {
    const student = byId.get(id);
    if (!student) continue;
    if (student.program !== scope.program) continue;
    if (scope.campus && student.campus !== scope.campus) continue;
    ordered.push(student);
  }
  const score = scope.score ?? "cycle";
  const cutoff = scope.highFiveSize ?? HIGH_FIVE_SIZE;
  return ordered.map((student, index) => {
    const rank = index + 1;
    const dollars = scoreDollars(student, score);
    const points = studentPoints(dollars);
    return {
      ...student,
      points,
      total: points,
      rank,
      campusRank: rank,
      previousRank: rank,
      rankDelta: 0,
      displayName: displayName(student),
      highFive: score === "cycle" && rank <= cutoff,
      allTime: score === "career" && rank <= cutoff,
      scoreKind: score,
    };
  });
}

export function omitHiddenStudents(
  rows: RankedStudent[],
  hiddenIds: string[],
  highFiveSize = HIGH_FIVE_SIZE,
): RankedStudent[] {
  if (!hiddenIds.length) return rows;
  const hidden = new Set(hiddenIds);
  return rows
    .filter((row) => !hidden.has(row.id))
    .map((row, index) => {
      const rank = index + 1;
      return {
        ...row,
        rank,
        campusRank: rank,
        rankDelta: row.previousRank - rank,
        highFive: row.scoreKind === "cycle" && rank <= highFiveSize,
        allTime: row.scoreKind === "career" && rank <= highFiveSize,
      };
    });
}

export function rankTvPrograms(
  students: StudentRecord[],
  options: {
    campus?: Campus;
    institute?: boolean;
    allTime?: boolean;
    highFiveSize?: number;
    frozenScopes: FreezeScope[];
    frozenRanks: Record<string, string[]>;
    hiddenStudentIds: string[];
  },
): Record<Program, RankedStudent[]> {
  const score: ScoreKind = options.allTime ? "career" : "cycle";
  const campus = options.allTime || options.institute ? undefined : options.campus;
  const freezeCampus: Campus | "all" = campus ?? "all";
  const frozen = ranksFrozenFor(options.frozenScopes, options.campus, options.allTime);
  return Object.fromEntries(
    PROGRAMS.map((program) => {
      const ranked = applyFrozenOrder(
        students,
        frozen ? options.frozenRanks[freezeRankKey(score, freezeCampus, program)] : undefined,
        { program, campus, score, highFiveSize: options.highFiveSize },
      );
      return [program, omitHiddenStudents(ranked, options.hiddenStudentIds, options.highFiveSize)];
    }),
  ) as Record<Program, RankedStudent[]>;
}

export type DummyTicket = {
  id: string;
  studentId: string;
  date: string;
  service: number;
  retail: number;
};

export type RosterOverride = {
  optIn: Record<string, boolean>;
  addedStudents: StudentRecord[];
  cycleTotals: Record<string, { service: number; retail: number }>;
  cycleCleared: boolean;
  careerCleared: boolean;
};

function hashId(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function enumerateDays(startDate: string, endDate: string) {
  const days: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) {
    return days;
  }
  while (cursor <= end) {
    days.push(toIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Deterministic dummy tickets that sum to the student's seed cycle totals. */
export function dummyTickets(
  student: Pick<StudentRecord, "id" | "service" | "retail">,
  seedStart: string,
  seedEnd: string,
): DummyTicket[] {
  const days = enumerateDays(seedStart, seedEnd);
  const buckets = days.filter((_, index) => index % 7 === 0);
  const slots = buckets.length || 1;
  const dates = buckets.length ? buckets : [seedStart];
  const tickets: DummyTicket[] = [];
  let serviceLeft = Math.max(0, student.service);
  let retailLeft = Math.max(0, student.retail);
  for (let index = 0; index < slots; index += 1) {
    const last = index === slots - 1;
    const service = last ? serviceLeft : Math.floor(student.service / slots);
    const retail = last ? retailLeft : Math.floor(student.retail / slots);
    serviceLeft -= service;
    retailLeft -= retail;
    const offset = hashId(student.id) % Math.min(7, Math.max(1, days.length || 1));
    const date = days[Math.min(days.length - 1, days.indexOf(dates[index]) + offset)] ?? dates[index];
    tickets.push({
      id: `${student.id}-t${index + 1}`,
      studentId: student.id,
      date,
      service,
      retail,
    });
  }
  return tickets;
}

export function pullCycleTotals(
  students: StudentRecord[],
  startDate: string,
  endDate: string,
  seedStart: string,
  seedEnd: string,
) {
  const totals: Record<string, { service: number; retail: number }> = {};
  let ticketCount = 0;
  for (const student of students) {
    const tickets = dummyTickets(student, seedStart, seedEnd).filter(
      (ticket) => ticket.date >= startDate && ticket.date <= endDate,
    );
    ticketCount += tickets.length;
    totals[student.id] = {
      service: tickets.reduce((sum, ticket) => sum + ticket.service, 0),
      retail: tickets.reduce((sum, ticket) => sum + ticket.retail, 0),
    };
  }
  return { totals, ticketCount };
}

export function composeStudents(
  seedStudents: StudentRecord[],
  store: RosterOverride,
  studentConsent: Record<string, boolean> = {},
): StudentRecord[] {
  const roster = [...seedStudents, ...store.addedStudents];
  return roster.map((student) => {
    const pulled = store.cycleTotals[student.id];
    const service = store.cycleCleared && !pulled ? 0 : pulled ? pulled.service : student.service;
    const retail = store.cycleCleared && !pulled ? 0 : pulled ? pulled.retail : student.retail;
    const careerService = store.careerCleared ? 0 : student.careerService;
    const careerRetail = store.careerCleared ? 0 : student.careerRetail;
    const optedIn = Object.hasOwn(store.optIn, student.id)
      ? store.optIn[student.id]
      : Object.hasOwn(studentConsent, student.id)
        ? studentConsent[student.id]
        : student.optedIn;
    return { ...student, service, retail, careerService, careerRetail, optedIn };
  });
}

export function applyConsent(
  students: StudentRecord[],
  overrides: Record<string, boolean> = {},
  adminOverrides: Record<string, boolean> = {},
): StudentRecord[] {
  return students.map((student) => {
    if (Object.hasOwn(adminOverrides, student.id)) {
      return { ...student, optedIn: adminOverrides[student.id] };
    }
    if (Object.hasOwn(overrides, student.id)) {
      return { ...student, optedIn: overrides[student.id] };
    }
    return student;
  });
}

export function cycleFromRange(startDate: string, endDate: string): Cycle {
  const start = startDate || "2026-07-20";
  const end = endDate || start;
  const startLabel = parseIso(start).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  return {
    id: start,
    label: `${startLabel} start`,
    startDate: start,
    endDate: end,
    weeks: cycleLengthWeeks(start, end),
    note: "Admin-selected dummy cycle range.",
  };
}
