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
  listPageWindow,
  rankStudents,
  studentTotal,
  type StudentRecord,
} from "./leaderboard.ts";

const fixtures: StudentRecord[] = [
  {
    id: "AFI-1",
    firstName: "Jordan",
    lastName: "Reyes",
    lastInitial: "R",
    optedIn: true,
    program: "cosmetology",
    campus: "north",
    service: 200,
    retail: 100,
    previousRank: 3,
  },
  {
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
  },
  {
    id: "AFI-3",
    firstName: "Casey",
    lastName: "Miles",
    lastInitial: "M",
    optedIn: true,
    program: "cosmetology",
    campus: "south",
    service: 400,
    retail: 50,
    previousRank: 1,
  },
  {
    id: "AFI-4",
    firstName: "Avery",
    lastName: "Kane",
    lastInitial: "K",
    optedIn: true,
    program: "nailTechnology",
    campus: "north",
    service: 900,
    retail: 10,
    previousRank: 1,
  },
];

describe("studentTotal", () => {
  it("is service plus retail", () => {
    assert.equal(studentTotal({ service: 200, retail: 100 }), 300);
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
  it("ranks only within the requested program", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology" });
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].id, "AFI-3");
    assert.deepEqual(
      ranked.map((student) => student.program),
      ["cosmetology", "cosmetology", "cosmetology"],
    );
  });

  it("can further limit a campus board to that campus", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology", campus: "north" });
    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].id, "AFI-1");
    assert.equal(ranked[0].total, 300);
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

  it("awards most-retail and most-services badges in scope", () => {
    const ranked = rankStudents(fixtures, { program: "cosmetology" });
    const mostRetail = ranked.filter((student) => student.badges.mostRetail);
    const mostServices = ranked.filter((student) => student.badges.mostServices);
    assert.equal(mostRetail[0]?.id, "AFI-1");
    assert.equal(mostServices[0]?.id, "AFI-3");
  });

  it("marks High Five winners as ranks 1–5 only", () => {
    const extras: StudentRecord[] = Array.from({ length: 6 }, (_, index) => ({
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
    }));
    const north = rankStudents([...fixtures, ...extras], { program: "cosmetology", campus: "north" });
    assert.equal(north.length, 8);
    assert.deepEqual(
      north.map((student) => student.highFive),
      [true, true, true, true, true, false, false, false],
    );
    assert.equal(north[0].rank, 1);
    assert.equal(north[5].rank, 6);
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
