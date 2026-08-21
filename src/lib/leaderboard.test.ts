import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  campusTotals,
  cycleWeek,
  displayName,
  formatMoney,
  rankStudents,
  studentTotal,
  type StudentRecord,
} from "./leaderboard.ts";

const fixtures: StudentRecord[] = [
  {
    id: "AFI-1",
    firstName: "Jordan",
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
    lastInitial: "K",
    optedIn: true,
    program: "nails",
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

  it("does not mix a nails total into a cosmetology board", () => {
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
});

describe("campusTotals", () => {
  it("sums only the requested campus", () => {
    const north = campusTotals(fixtures, "north");
    assert.equal(north.total, 200 + 100 + 180 + 90 + 900 + 10);
    assert.equal(north.byProgram.cosmetology.total, 570);
    assert.equal(north.byProgram.nails.total, 910);
  });
});

describe("helpers", () => {
  it("formats money without cents", () => {
    assert.equal(formatMoney(1240), "$1,240");
  });

  it("clamps the cycle week between 1 and the cycle length", () => {
    const cycle = {
      id: "x",
      label: "test",
      startDate: "2026-08-10",
      endDate: "2026-09-25",
      weeks: 7,
      note: "",
    };
    assert.equal(cycleWeek(cycle, new Date("2026-08-21T12:00:00")), 2);
    assert.equal(cycleWeek(cycle, new Date("2026-08-09T12:00:00")), 1);
    assert.equal(cycleWeek(cycle, new Date("2026-12-01T12:00:00")), 7);
  });
});
