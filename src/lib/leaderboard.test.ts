import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PROGRAMS,
  PROGRAM_LABELS,
  applyConsent,
  campusTotals,
  cycleForDate,
  cycleWeek,
  displayName,
  findStudentByLogin,
  formatCycleRange,
  formatMoney,
  fridayBefore,
  formatPoints,
  listPageWindow,
  rankStudents,
  tvStageScale,
  studentPoints,
  type StudentRecord,
} from "./leaderboard.ts";

function record(partial: Partial<StudentRecord> & Pick<StudentRecord, "id" | "firstName" | "lastName" | "program" | "campus" | "service" | "retail">): StudentRecord {
  return {
    lastInitial: partial.lastName[0],
    optedIn: true,
    careerService: partial.service,
    careerRetail: partial.retail,
    startedOn: "2026-07-20",
    ...partial,
  };
}

const fixtures: StudentRecord[] = [
  record({
    id: "AFI-1",
    firstName: "Jordan",
    lastName: "Reyes",
    lastInitial: "R",
    program: "cosmetology",
    campus: "north",
    service: 200,
    retail: 100,
    previousRank: 3,
  }),
  record({
    id: "AFI-2",
    firstName: "Riley",
    lastName: "Cruz",
    lastInitial: "C",
    optedIn: false,
    program: "cosmetology",
    campus: "north",
    service: 180,
    retail: 90,
    previousRank: 1,
  }),
  record({
    id: "AFI-3",
    firstName: "Casey",
    lastName: "Miles",
    lastInitial: "M",
    program: "cosmetology",
    campus: "south",
    service: 400,
    retail: 50,
    previousRank: 1,
  }),
  record({
    id: "AFI-4",
    firstName: "Avery",
    lastName: "Kane",
    lastInitial: "K",
    program: "nailTechnology",
    campus: "north",
    service: 900,
    retail: 10,
    previousRank: 1,
  }),
];

describe("studentPoints", () => {
  it("is 1 pt per service dollar and 5 pts per retail dollar", () => {
    assert.equal(studentPoints({ service: 200, retail: 100 }), 700);
    assert.equal(studentPoints({ service: 1860, retail: 420 }), 3960);
  });
});

describe("displayName", () => {
  it("uses first name and last initial when opted in", () => {
    assert.equal(displayName(fixtures[0]), "Jordan R.");
  });

  it("uses Student plus ID when not opted in", () => {
    assert.equal(displayName(fixtures[1]), "Student AFI-2");
  });
});

describe("programs", () => {
  it("uses Avenue Five names and column order", () => {
    assert.deepEqual([...PROGRAMS], [
      "cosmetology",
      "barbering",
      "esthetics",
      "nailTechnology",
    ]);
    assert.equal(PROGRAM_LABELS.esthetics, "Esthetics");
    assert.equal(PROGRAM_LABELS.nailTechnology, "Nail Technology");
  });
});

describe("rankStudents", () => {
  it("ranks only within the requested program by points, not raw dollars", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology" });
    assert.equal(ranked.length, 3);
    // AFI-3 has more dollars (450 vs 300) but AFI-1 has more points (700 vs 650).
    assert.equal(ranked[0].id, "AFI-1");
    assert.equal(ranked[0].points, 700);
    assert.equal(ranked[1].id, "AFI-3");
    assert.equal(ranked[1].points, 650);
    assert.deepEqual(
      ranked.map((student) => student.program),
      ["cosmetology", "cosmetology", "cosmetology"],
    );
  });

  it("lets a retail-heavy student outrank a higher service-dollar student", () => {
    const ranked = rankStudents(
      [
        {
          ...fixtures[0],
          id: "AFI-SVC",
          service: 2000,
          retail: 40,
        },
        {
          ...fixtures[0],
          id: "AFI-RTL",
          firstName: "Remy",
          lastName: "Vega",
          lastInitial: "V",
          service: 1100,
          retail: 280,
        },
      ],
      { program: "cosmetology" },
    );
    assert.ok(2000 + 40 > 1100 + 280);
    assert.equal(studentPoints(ranked[0]), 1100 + 280 * 5);
    assert.equal(ranked[0].id, "AFI-RTL");
    assert.equal(ranked[1].id, "AFI-SVC");
    assert.equal(ranked[0].highFive, true);
  });

  it("can further limit a campus board to that campus", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology", campus: "north" });
    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].id, "AFI-1");
    assert.equal(ranked[0].points, 700);
    assert.equal(ranked[0].rank, 1);
  });

  it("does not mix a nail technology total into a cosmetology board", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology" });
    assert.equal(
      ranked.some((student) => student.id === "AFI-4"),
      false,
    );
  });

  it("computes rank arrows from previous rank", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology", campus: "north" });
    const jumped = ranked.find((student) => student.id === "AFI-1");
    const dropped = ranked.find((student) => student.id === "AFI-2");
    assert.equal(jumped?.rankDelta, 2);
    assert.equal(dropped?.rankDelta, -1);
  });

  it("marks High Five winners as ranks 1–5 only", () => {
    const extras: StudentRecord[] = Array.from({ length: 6 }, (_, index) =>
      record({
        id: `AFI-N${index}`,
        firstName: "Pat",
        lastName: "North",
        lastInitial: "N",
        optedIn: index % 2 === 0,
        program: "cosmetology",
        campus: "north",
        service: 80 - index,
        retail: 10,
        previousRank: index + 3,
      }),
    );
    const north = rankStudents([...fixtures, ...extras], { program: "cosmetology", campus: "north" });
    assert.equal(north.length, 8);
    assert.deepEqual(
      north.map((student) => student.highFive),
      [true, true, true, true, true, false, false, false],
    );
    assert.equal(north[0].rank, 1);
    assert.equal(north[0].highFive, true);
    assert.equal(north[0].allTime, false);
    assert.equal(north[5].rank, 6);
  });

  it("ranks all-time by career points, not this-cycle dollars", () => {
    const ranked = rankStudents(
      [
        record({
          id: "AFI-NEW",
          firstName: "Nova",
          lastName: "Pike",
          program: "cosmetology",
          campus: "north",
          service: 2200,
          retail: 400,
          careerService: 2200,
          careerRetail: 400,
          startedOn: "2026-07-20",
        }),
        record({
          id: "AFI-VET",
          firstName: "Vera",
          lastName: "Long",
          program: "cosmetology",
          campus: "south",
          service: 900,
          retail: 80,
          careerService: 8200,
          careerRetail: 1600,
          startedOn: "2025-11-17",
        }),
      ],
      { program: "cosmetology", score: "career" },
    );
    assert.equal(ranked[0].id, "AFI-VET");
    assert.equal(ranked[0].points, 8200 + 1600 * 5);
    assert.equal(ranked[0].highFive, false);
    assert.equal(ranked[0].allTime, true);
    assert.equal(ranked[1].id, "AFI-NEW");
    const cycle = rankStudents(
      [
        record({
          id: "AFI-NEW",
          firstName: "Nova",
          lastName: "Pike",
          program: "cosmetology",
          campus: "north",
          service: 2200,
          retail: 400,
        }),
        record({
          id: "AFI-VET",
          firstName: "Vera",
          lastName: "Long",
          program: "cosmetology",
          campus: "south",
          service: 900,
          retail: 80,
          careerService: 8200,
          careerRetail: 1600,
        }),
      ],
      { program: "cosmetology" },
    );
    assert.equal(cycle[0].id, "AFI-NEW");
    assert.equal(cycle[0].highFive, true);
  });
});

describe("login and consent", () => {
  it("signs in with student ID and last name, not a PIN", () => {
    assert.equal(findStudentByLogin(fixtures, "afi-1", "Reyes")?.id, "AFI-1");
    assert.equal(findStudentByLogin(fixtures, "AFI-1", "wrong"), null);
  });

  it("applies dummy opt-in overrides to display names", () => {
    const hidden = applyConsent(fixtures, { "AFI-1": false });
    assert.equal(displayName(hidden[0]), "Student AFI-1");
    const shown = applyConsent(fixtures, { "AFI-2": true });
    assert.equal(displayName(shown[1]), "Riley C.");
  });
});

describe("campusTotals", () => {
  it("sums only the requested campus", () => {
    const north = campusTotals(fixtures, "north");
    assert.equal(north.total, 200 + 100 + 180 + 90 + 900 + 10);
    assert.equal(north.byProgram.cosmetology.total, 570);
    assert.equal(north.byProgram.nailTechnology.total, 910);
  });
});

describe("tvStageScale", () => {
  it("letterboxes a 1280×800 desktop so the 16:9 stage fits", () => {
    const scale = tvStageScale(1280, 800);
    assert.equal(scale, 1280 / 1920);
    assert.ok(1080 * scale <= 800);
    assert.equal(1920 * scale, 1280);
  });

  it("is 1 on a 1920×1080 TV and can grow on 4K", () => {
    assert.equal(tvStageScale(1920, 1080), 1);
    assert.equal(tvStageScale(3840, 2160), 2);
  });
});

describe("tv leftover pages", () => {
  it("keeps Nail Technology ranks 16–17 on page 1 when only 15 rows fit", () => {
    const first = listPageWindow(17, 15, 0);
    assert.equal(first.pageCount, 1);
    assert.equal(first.start, 0);
    assert.equal(first.end, 17);
    assert.equal(listPageWindow(17, 15, 1).end, 17);
  });

  it("does not create a last page of 1–7 names", () => {
    assert.equal(listPageWindow(17, 12, 0).pageCount, 1);
    assert.equal(listPageWindow(17, 16, 0).end, 17);
    const folded = listPageWindow(31, 15, 1);
    assert.equal(folded.start, 15);
    assert.equal(folded.end, 31);
    assert.ok(folded.end - folded.start >= 8);
  });

  it("keeps Cosmetology and Esthetics last pages at 8+ normal-height rows", () => {
    const cosmo = listPageWindow(29, 17, 1);
    assert.equal(cosmo.start, 17);
    assert.equal(cosmo.end, 29);
    assert.ok(cosmo.end - cosmo.start >= 8);
    const esthetics = listPageWindow(31, 17, 1);
    assert.equal(esthetics.start, 17);
    assert.equal(esthetics.end, 31);
    assert.ok(esthetics.end - esthetics.start >= 8);
  });
});

describe("listPageWindow", () => {
  it("pages a 39-row Esthetics column so later ranks are reachable", () => {
    const first = listPageWindow(39, 15, 0);
    assert.deepEqual(first, { page: 0, pageCount: 3, start: 0, end: 15, size: 15 });
    const second = listPageWindow(39, 15, 1);
    assert.deepEqual(second, { page: 1, pageCount: 3, start: 15, end: 30, size: 15 });
    const last = listPageWindow(39, 15, 2);
    assert.deepEqual(last, { page: 2, pageCount: 3, start: 30, end: 39, size: 15 });
    assert.equal(listPageWindow(39, 15, 3).page, 0);
    assert.equal(listPageWindow(39, 15, -1).page, 2);
  });

  it("does not invent extra pages for a short Barbering column", () => {
    const window = listPageWindow(8, 15, 4);
    assert.deepEqual(window, { page: 0, pageCount: 1, start: 0, end: 8, size: 15 });
  });
});

describe("helpers", () => {
  it("formats money without cents", () => {
    assert.equal(formatMoney(1240), "$1,240");
  });

  it("formats points without a dollar sign", () => {
    assert.equal(formatPoints(3960), "3,960 pts");
  });

  it("ends a cycle on the Friday before the next class start", () => {
    assert.equal(fridayBefore("2026-08-31"), "2026-08-28");
    assert.equal(fridayBefore("2026-10-19"), "2026-10-16");
  });

  it("uses July 20 – August 28 as the current cycle on August 21, 2026", () => {
    const current = cycleForDate(new Date("2026-08-21T12:00:00"));
    assert.equal(current.startDate, "2026-07-20");
    assert.equal(current.endDate, "2026-08-28");
    assert.equal(current.weeks, 6);
    assert.equal(formatCycleRange(current), "July 20 – August 28");
    assert.equal(cycleWeek(current, new Date("2026-08-21T12:00:00")), 5);
  });

  it("does not treat the August 31 cycle as current before that start", () => {
    const next = cycleForDate(new Date("2026-08-31T12:00:00"));
    assert.equal(next.startDate, "2026-08-31");
    assert.equal(next.endDate, "2026-10-16");
  });

  it("clamps the cycle week between 1 and the cycle length", () => {
    const cycle = cycleForDate(new Date("2026-08-21T12:00:00"));
    assert.equal(cycleWeek(cycle, new Date("2026-07-19T12:00:00")), 1);
    assert.equal(cycleWeek(cycle, new Date("2026-09-01T12:00:00")), 6);
  });
});
