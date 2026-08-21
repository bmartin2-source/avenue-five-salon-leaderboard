export const PROGRAMS = [
  "cosmetology",
  "aesthetics",
  "barbering",
  "nails",
] as const;

export const CAMPUSES = ["north", "south"] as const;

export type Program = (typeof PROGRAMS)[number];
export type Campus = (typeof CAMPUSES)[number];

export type StudentRecord = {
  id: string;
  firstName: string;
  lastInitial: string;
  optedIn: boolean;
  program: Program;
  campus: Campus;
  service: number;
  retail: number;
  previousRank?: number;
};

export type AccountRecord = {
  id: string;
  pin: string;
  firstName: string;
  lastInitial: string;
  optedIn: boolean;
  program: Program;
  campus: Campus;
};

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
  cycle: Cycle;
  sponsors: Sponsor[];
  accounts: AccountRecord[];
  students: StudentRecord[];
};

export type RankedStudent = StudentRecord & {
  total: number;
  rank: number;
  previousRank: number;
  rankDelta: number;
  displayName: string;
  badges: {
    mostRetail: boolean;
    mostServices: boolean;
  };
};

export type BoardScope = {
  program: Program;
  campus?: Campus;
};

export const PROGRAM_LABELS: Record<Program, string> = {
  cosmetology: "Cosmetology",
  aesthetics: "Aesthetics",
  barbering: "Barbering",
  nails: "Nails",
};

export const CAMPUS_LABELS: Record<Campus, string> = {
  north: "North Campus",
  south: "South Campus",
};

export function studentTotal(student: Pick<StudentRecord, "service" | "retail">): number {
  return student.service + student.retail;
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

export function cycleWeek(cycle: Cycle, today = new Date()): number {
  const start = new Date(`${cycle.startDate}T00:00:00`);
  const diff = today.getTime() - start.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(cycle.weeks, Math.max(1, week));
}

export function rankStudents(
  students: StudentRecord[],
  scope: BoardScope,
): RankedStudent[] {
  const list = students
    .filter((student) => {
      if (student.program !== scope.program) return false;
      if (scope.campus && student.campus !== scope.campus) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const totalDiff = studentTotal(b) - studentTotal(a);
      if (totalDiff !== 0) return totalDiff;
      const serviceDiff = b.service - a.service;
      if (serviceDiff !== 0) return serviceDiff;
      return a.id.localeCompare(b.id);
    });

  const maxRetail = Math.max(0, ...list.map((student) => student.retail));
  const maxService = Math.max(0, ...list.map((student) => student.service));

  return list.map((student, index) => {
    const rank = index + 1;
    const previousRank = student.previousRank ?? rank;
    return {
      ...student,
      total: studentTotal(student),
      rank,
      previousRank,
      rankDelta: previousRank - rank,
      displayName: displayName(student),
      badges: {
        mostRetail: student.retail === maxRetail && maxRetail > 0,
        mostServices: student.service === maxService && maxService > 0,
      },
    };
  });
}

export function rankAllPrograms(
  students: StudentRecord[],
  campus?: Campus,
): Record<Program, RankedStudent[]> {
  return {
    cosmetology: rankStudents(students, { program: "cosmetology", campus }),
    aesthetics: rankStudents(students, { program: "aesthetics", campus }),
    barbering: rankStudents(students, { program: "barbering", campus }),
    nails: rankStudents(students, { program: "nails", campus }),
  };
}

export function campusTotals(students: StudentRecord[], campus: Campus) {
  const subset = students.filter((student) => student.campus === campus);
  const byProgram = Object.fromEntries(
    PROGRAMS.map((program) => {
      const programStudents = subset.filter((student) => student.program === program);
      const service = programStudents.reduce((sum, student) => sum + student.service, 0);
      const retail = programStudents.reduce((sum, student) => sum + student.retail, 0);
      return [program, { service, retail, total: service + retail, count: programStudents.length }];
    }),
  ) as Record<Program, { service: number; retail: number; total: number; count: number }>;

  const service = subset.reduce((sum, student) => sum + student.service, 0);
  const retail = subset.reduce((sum, student) => sum + student.retail, 0);
  return { campus, service, retail, total: service + retail, count: subset.length, byProgram };
}

export function findAccount(
  accounts: AccountRecord[],
  studentId: string,
  pin: string,
): AccountRecord | null {
  const id = studentId.trim().toUpperCase();
  const match = accounts.find((account) => account.id.toUpperCase() === id);
  if (!match || match.pin !== pin.trim()) return null;
  return match;
}

export function findStudent(
  students: StudentRecord[],
  studentId: string,
): StudentRecord | undefined {
  return students.find((student) => student.id.toUpperCase() === studentId.trim().toUpperCase());
}
