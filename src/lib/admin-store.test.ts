import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyConsent,
  applyFrozenOrder,
  composeStudents,
  dummyTickets,
  isQuietHours,
  omitHiddenStudents,
  pullCycleTotals,
  rankStudents,
  ranksFrozenFor,
  snapshotFrozenRanks,
  tvRowHeight,
  verifyAdminLogin,
  verifyStaffLogin,
  type RosterOverride,
  type StudentRecord,
} from "./leaderboard.ts";

function student(partial: Partial<StudentRecord> & Pick<StudentRecord, "id">): StudentRecord {
  return {
    firstName: "Jordan",
    lastName: "Reyes",
    lastInitial: "R",
    optedIn: true,
    program: "cosmetology",
    campus: "north",
    service: 1000,
    retail: 100,
    careerService: 5000,
    careerRetail: 400,
    startedOn: "2026-07-20",
    ...partial,
  };
}

function store(partial: Partial<RosterOverride> = {}): RosterOverride {
  return {
    optIn: {},
    addedStudents: [],
    cycleTotals: {},
    cycleCleared: false,
    careerCleared: false,
    ...partial,
  };
}

describe("admin dummy login", () => {
  it("accepts the dummy staff email and PIN", () => {
    assert.equal(verifyAdminLogin("admin@avenuefive.com", "2468"), true);
    assert.equal(verifyAdminLogin("ADMIN@avenuefive.com", "2468"), true);
    assert.equal(verifyAdminLogin("admin@avenuefive.com", "0000"), false);
  });

  it("maps campus-manager vs institute-admin dummy roles", () => {
    assert.deepEqual(verifyStaffLogin("admin@avenuefive.com", "2468"), {
      role: "institute-admin",
      campus: undefined,
      email: "admin@avenuefive.com",
    });
    assert.deepEqual(verifyStaffLogin("north@avenuefive.com", "1357"), {
      role: "campus-manager",
      campus: "north",
      email: "north@avenuefive.com",
    });
    assert.deepEqual(verifyStaffLogin("south@avenuefive.com", "1357"), {
      role: "campus-manager",
      campus: "south",
      email: "south@avenuefive.com",
    });
    assert.equal(verifyStaffLogin("north@avenuefive.com", "2468"), null);
    assert.equal(verifyAdminLogin("north@avenuefive.com", "1357"), false);
  });
});

describe("quiet hours", () => {
  it("treats an overnight 21:00–07:00 window as closed after hours", () => {
    const date = (hours: number, minutes = 0) => {
      const next = new Date("2026-08-23T00:00:00");
      next.setHours(hours, minutes, 0, 0);
      return next;
    };
    assert.equal(isQuietHours(date(22, 0), "21:00", "07:00", true), true);
    assert.equal(isQuietHours(date(6, 30), "21:00", "07:00", true), true);
    assert.equal(isQuietHours(date(12, 0), "21:00", "07:00", true), false);
    assert.equal(isQuietHours(date(22, 0), "21:00", "07:00", false), false);
  });
});

describe("panic hide and freeze", () => {
  it("omits hidden students from the TV list without showing a name", () => {
    const ranked = rankStudents(
      [
        student({ id: "AFI-1", service: 900 }),
        student({ id: "AFI-2", service: 800 }),
        student({ id: "AFI-3", service: 700 }),
      ],
      { program: "cosmetology" },
    );
    const visible = omitHiddenStudents(ranked, ["AFI-2"]);
    assert.deepEqual(
      visible.map((row) => [row.id, row.rank]),
      [
        ["AFI-1", 1],
        ["AFI-3", 2],
      ],
    );
  });

  it("closes the hole when rank 1 is hidden so the list starts at 1", () => {
    const ranked = rankStudents(
      [
        student({ id: "AFI-2401", service: 900 }),
        student({ id: "AFI-2", service: 800 }),
        student({ id: "AFI-3", service: 700 }),
      ],
      { program: "cosmetology" },
    );
    const visible = omitHiddenStudents(ranked, ["AFI-2401"]);
    assert.deepEqual(
      visible.map((row) => [row.id, row.rank]),
      [
        ["AFI-2", 1],
        ["AFI-3", 2],
      ],
    );
    assert.equal(visible[0].highFive, true);
  });

  it("keeps the frozen walk-on order after live totals change", () => {
    const before = [
      student({ id: "AFI-1", service: 900, retail: 10 }),
      student({ id: "AFI-2", service: 400, retail: 10 }),
    ];
    const snap = snapshotFrozenRanks(before, ["north"]);
    const after = [
      student({ id: "AFI-1", service: 100, retail: 10 }),
      student({ id: "AFI-2", service: 900, retail: 80 }),
    ];
    const live = rankStudents(after, { campus: "north", program: "cosmetology" });
    assert.equal(live[0].id, "AFI-2");
    const frozen = applyFrozenOrder(after, snap["cycle:north:cosmetology"], {
      campus: "north",
      program: "cosmetology",
    });
    assert.deepEqual(
      frozen.map((row) => row.id),
      ["AFI-1", "AFI-2"],
    );
    assert.equal(ranksFrozenFor(["north"], "north", false), true);
    assert.equal(ranksFrozenFor(["north"], "south", false), false);
    assert.equal(ranksFrozenFor(["north"], "north", true), false);
  });
});

describe("TV type steps", () => {
  it("keeps the default mid-size row height and only nudges larger/smaller", () => {
    assert.equal(tvRowHeight(0), 50);
    assert.equal(tvRowHeight(-1), 48);
    assert.equal(tvRowHeight(1), 54);
  });
});

describe("dummy tickets", () => {
  it("sums to the seed cycle service and retail over the full range", () => {
    const row = student({ id: "AFI-2401", service: 1680, retail: 520 });
    const tickets = dummyTickets(row, "2026-07-20", "2026-08-28");
    assert.ok(tickets.length >= 1);
    assert.equal(
      tickets.reduce((sum, ticket) => sum + ticket.service, 0),
      1680,
    );
    assert.equal(
      tickets.reduce((sum, ticket) => sum + ticket.retail, 0),
      520,
    );
  });

  it("pulls a smaller current-cycle total when the date range is narrower", () => {
    const roster = [student({ id: "AFI-2401", service: 1680, retail: 520 })];
    const full = pullCycleTotals(roster, "2026-07-20", "2026-08-28", "2026-07-20", "2026-08-28");
    const week = pullCycleTotals(roster, "2026-07-20", "2026-07-26", "2026-07-20", "2026-08-28");
    assert.equal(full.totals["AFI-2401"].service, 1680);
    assert.ok(week.totals["AFI-2401"].service <= full.totals["AFI-2401"].service);
    assert.ok(week.ticketCount <= full.ticketCount);
  });
});

describe("composeStudents", () => {
  it("lets an admin opt-out override student self-serve consent", () => {
    const roster = [student({ id: "AFI-2401", optedIn: true })];
    const live = composeStudents(roster, store({ optIn: { "AFI-2401": false } }), {
      "AFI-2401": true,
    });
    assert.equal(live[0].optedIn, false);
  });

  it("clears current-cycle totals without wiping career history", () => {
    const roster = [student({ id: "AFI-2401" })];
    const live = composeStudents(roster, store({ cycleCleared: true }));
    assert.equal(live[0].service, 0);
    assert.equal(live[0].retail, 0);
    assert.equal(live[0].careerService, 5000);
    assert.equal(live[0].careerRetail, 400);
  });

  it("clears all-time career totals only when that reset is set", () => {
    const roster = [student({ id: "AFI-2401" })];
    const live = composeStudents(roster, store({ careerCleared: true }));
    assert.equal(live[0].careerService, 0);
    assert.equal(live[0].careerRetail, 0);
    assert.equal(live[0].service, 1000);
  });
});

describe("admin consent merge", () => {
  it("gives admin overrides priority in applyConsent", () => {
    const roster = [student({ id: "AFI-2401", optedIn: true })];
    const merged = applyConsent(roster, { "AFI-2401": true }, { "AFI-2401": false });
    assert.equal(merged[0].optedIn, false);
  });
});

describe("high five cutoff", () => {
  it("can mark only the top 3 as High Five", () => {
    const roster = Array.from({ length: 6 }, (_, index) =>
      student({
        id: `AFI-${index}`,
        service: 600 - index * 40,
        retail: 10,
      }),
    );
    const ranked = rankStudents(roster, { program: "cosmetology", highFiveSize: 3 });
    assert.deepEqual(
      ranked.map((row) => row.highFive),
      [true, true, true, false, false, false],
    );
  });
});
