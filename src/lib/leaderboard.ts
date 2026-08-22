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
      highFive: score === "cycle" && rank <= HIGH_FIVE_SIZE,
      allTime: score === "career" && rank <= HIGH_FIVE_SIZE,
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
): Record<Program, RankedStudent[]> {
  return Object.fromEntries(
    PROGRAMS.map((program) => [program, rankStudents(students, { program, campus, score })]),
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

export function applyConsent(
  students: StudentRecord[],
  overrides: Record<string, boolean> = {},
): StudentRecord[] {
  return students.map((student) =>
    Object.hasOwn(overrides, student.id)
      ? { ...student, optedIn: overrides[student.id] }
      : student,
  );
}
