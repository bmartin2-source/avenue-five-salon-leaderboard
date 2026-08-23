import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyConsent,
  composeStudents,
  dummyTickets,
  pullCycleTotals,
  rankStudents,
  verifyAdminLogin,
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
