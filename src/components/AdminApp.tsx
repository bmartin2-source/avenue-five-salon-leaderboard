"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DUMMY_ADMIN_EMAIL,
  DUMMY_ADMIN_PIN,
  DUMMY_CAMPUS_PIN,
  DUMMY_NORTH_EMAIL,
  DUMMY_SOUTH_EMAIL,
  adminCycle,
  composeStudents,
  defaultAdminStore,
  freezeStore,
  pullCycleTotals,
  readAdminStore,
  readStaffSession,
  staffCampus,
  staffIsInstitute,
  toggleHiddenStudent,
  tvStatusLine,
  unfreezeStore,
  verifyStaffLogin,
  writeAdminStore,
  writeStaffSession,
  type AdminStore,
  type TickerItem,
  type TvSlideKey,
} from "@/lib/admin-store";
import { data } from "@/lib/data";
import {
  CAMPUS_LABELS,
  CAMPUSES,
  PROGRAM_LABELS,
  PROGRAMS,
  clampTypeStep,
  formatCycleRange,
  type Campus,
  type FreezeScope,
  type KioskPin,
  type Program,
  type StaffSession,
  type StudentRecord,
  type TvTypeStep,
} from "@/lib/leaderboard";
import { readConsentOverrides } from "@/lib/session";

function commit(store: AdminStore, setStore: (next: AdminStore) => void) {
  setStore(writeAdminStore(store));
}

export function AdminApp() {
  const [session, setSession] = useState<StaffSession | null>(null);

  useEffect(() => {
    setSession(readStaffSession());
  }, []);

  if (!session) {
    return (
      <AdminLogin
        onSignedIn={(next) => {
          writeStaffSession(next);
          setSession(next);
        }}
      />
    );
  }

  return (
    <AdminDashboard
      session={session}
      onSignOut={() => {
        writeStaffSession(null);
        setSession(null);
      }}
    />
  );
}

function AdminLogin({ onSignedIn }: { onSignedIn: (session: StaffSession) => void }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = verifyStaffLogin(email, pin);
    if (!next) {
      setError("Dummy staff sign-in failed. Use one of the reviewer hub logins.");
      return;
    }
    onSignedIn(next);
  }

  return (
    <main className="auth">
      <div className="auth-inner">
        <p className="notice">Dummy staff sign-in · not production · do not deploy</p>
        <p className="kicker">Avenue Five Institute</p>
        <h1>High Five Admin</h1>
        <p className="lede">
          Instructor TV controls for the dummy High Five board. Role stub only — not real
          authentication.
        </p>
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="adminEmail">Staff email</label>
            <input
              id="adminEmail"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={DUMMY_ADMIN_EMAIL}
            />
          </div>
          <div className="field">
            <label htmlFor="adminPin">PIN</label>
            <input
              id="adminPin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder={DUMMY_ADMIN_PIN}
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Sign in
          </button>
        </form>
        <p className="hint" style={{ marginTop: 18 }}>
          Institute admin: <code>{DUMMY_ADMIN_EMAIL}</code> / <code>{DUMMY_ADMIN_PIN}</code>
        </p>
        <p className="hint">
          North campus manager: <code>{DUMMY_NORTH_EMAIL}</code> / <code>{DUMMY_CAMPUS_PIN}</code>
        </p>
        <p className="hint">
          South campus manager: <code>{DUMMY_SOUTH_EMAIL}</code> / <code>{DUMMY_CAMPUS_PIN}</code>
        </p>
        <p className="hint">
          <Link href="/">Back to reviewer hub</Link>
        </p>
      </div>
    </main>
  );
}

function AdminDashboard({
  session,
  onSignOut,
}: {
  session: StaffSession;
  onSignOut: () => void;
}) {
  const institute = staffIsInstitute(session);
  const myCampus = staffCampus(session);
  const [store, setStore] = useState<AdminStore>(() => readAdminStore(data));
  const [start, setStart] = useState(store.cycleStart);
  const [end, setEnd] = useState(store.cycleEnd);
  const [query, setQuery] = useState("");
  const [confirmCycle, setConfirmCycle] = useState(false);
  const [confirmCareer, setConfirmCareer] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [add, setAdd] = useState({
    firstName: "",
    lastName: "",
    id: "",
    campus: (myCampus ?? "north") as Campus,
    program: "cosmetology" as Program,
  });

  useEffect(() => {
    const next = readAdminStore(data);
    setStore(next);
    setStart(next.cycleStart);
    setEnd(next.cycleEnd);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const cycle = adminCycle(store);
  const students = useMemo(
    () => composeStudents(data.students, store, readConsentOverrides()),
    [store],
  );
  const scopedStudents = useMemo(
    () => (myCampus ? students.filter((student) => student.campus === myCampus) : students),
    [students, myCampus],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return scopedStudents.filter((student) => {
      if (!needle) return true;
      const blob = [
        student.firstName,
        student.lastName,
        student.id,
        student.campus,
        CAMPUS_LABELS[student.campus],
        student.program,
        PROGRAM_LABELS[student.program],
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [scopedStudents, query]);

  const freezeScopes: FreezeScope[] = institute ? ["all"] : myCampus ? [myCampus] : [];
  const frozenHere = institute
    ? store.frozenScopes.includes("all") || store.frozenScopes.length > 0
    : Boolean(myCampus && (store.frozenScopes.includes("all") || store.frozenScopes.includes(myCampus)));
  const instituteFrozen = store.frozenScopes.includes("all");
  const forceOptions = (
    institute
      ? [
          ["auto", "Auto"],
          ["north", "North Austin"],
          ["south", "South Austin"],
          ["institute", "All Institute"],
          ["allTime", "All-Time"],
        ]
      : [
          ["auto", "Auto"],
          [myCampus ?? "north", myCampus === "south" ? "South Austin" : "North Austin"],
        ]
  ) as Array<[TvSlideKey, string]>;

  function save(next: AdminStore) {
    commit(next, setStore);
  }

  function applyPull() {
    const roster = [...data.students, ...store.addedStudents];
    const pulled = pullCycleTotals(
      roster,
      start,
      end,
      data.cycle.startDate,
      data.cycle.endDate,
    );
    save({
      ...store,
      cycleStart: start,
      cycleEnd: end,
      cycleTotals: pulled.totals,
      cycleCleared: false,
      lastPull: {
        start,
        end,
        ticketCount: pulled.ticketCount,
        at: new Date().toISOString(),
      },
    });
  }

  function setOpt(id: string, optedIn: boolean) {
    save({ ...store, optIn: { ...store.optIn, [id]: optedIn } });
  }

  function addStudent(event: FormEvent) {
    event.preventDefault();
    const firstName = add.firstName.trim();
    const lastName = add.lastName.trim();
    const id = (add.id.trim() || `AFI-${9000 + store.addedStudents.length}`).toUpperCase();
    const campus = myCampus ?? add.campus;
    if (!firstName || !lastName) return;
    if (students.some((student) => student.id.toUpperCase() === id)) return;
    const record: StudentRecord = {
      id,
      firstName,
      lastName,
      lastInitial: lastName[0]?.toUpperCase() || "X",
      optedIn: true,
      program: add.program,
      campus,
      service: 0,
      retail: 0,
      careerService: 0,
      careerRetail: 0,
      startedOn: store.cycleStart,
    };
    save({ ...store, addedStudents: [...store.addedStudents, record] });
    setAdd({ firstName: "", lastName: "", id: "", campus, program: add.program });
  }

  function updateTicker(index: number, patch: Partial<TickerItem>) {
    const sponsors = store.sponsors.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    save({ ...store, sponsors });
  }

  function moveTicker(index: number, direction: -1 | 1) {
    const swap = index + direction;
    if (swap < 0 || swap >= store.sponsors.length) return;
    const sponsors = [...store.sponsors];
    [sponsors[index], sponsors[swap]] = [sponsors[swap], sponsors[index]];
    save({ ...store, sponsors });
  }

  function resetCampusCycle() {
    if (!myCampus) return;
    const cycleTotals = { ...store.cycleTotals };
    for (const student of scopedStudents) {
      cycleTotals[student.id] = { service: 0, retail: 0 };
    }
    save({ ...store, cycleTotals });
    setConfirmCycle(false);
  }

  const roleLabel = institute
    ? "Institute admin · both campuses + overall"
    : `${CAMPUS_LABELS[myCampus ?? "north"]} manager · this campus only`;

  return (
    <main className="admin">
      <header className="admin-top">
        <div>
          <p className="notice">Dummy administrator · local only · do not deploy</p>
          <p className="kicker">Avenue Five Institute · {roleLabel}</p>
          <h1>High Five Admin</h1>
        </div>
        <div className="admin-top-actions">
          <Link className="btn ghost" href="/tv/u/afi-salon-tv">
            Preview unlisted TV
          </Link>
          <Link className="btn ghost" href="/">
            Hub
          </Link>
          <button className="btn ghost" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-status">
        <p className="kicker">What the TV is showing now</p>
        <p>
          Live cycle: <strong>{formatCycleRange(cycle)}</strong> · {tvStatusLine(store, now)}
        </p>
        <p className="hint">
          Hold {store.pageHoldSeconds}s per list page · All-Time every {store.allTimeAfterSeconds}s
          {store.lastPull
            ? ` · Last pull ${store.lastPull.ticketCount} dummy tickets (${store.lastPull.start} – ${store.lastPull.end})`
            : " · Using seed cycle totals until you Apply / pull"}
          {store.savedAt ? ` · Saved ${store.savedAt.replace("T", " ").slice(0, 16)}` : ""}
        </p>
      </section>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Panic hide</h2>
          <p className="hint">
            Hide one student from the TV (row gone, name never shown). Opted-out students stay on
            the list as <code>Student AFI-xxxx</code>. Separate switch hides the whole board.
          </p>
          {institute ? (
            <button
              className={`chip danger ${store.boardHidden ? "on" : ""}`}
              type="button"
              onClick={() => save({ ...store, boardHidden: !store.boardHidden })}
            >
              {store.boardHidden ? "Board hidden · show board" : "Hide the whole board"}
            </button>
          ) : (
            <p className="hint">Whole-board hide is institute-admin only.</p>
          )}
          <p className="hint" style={{ marginTop: 12 }}>
            {store.hiddenStudentIds.length} student{store.hiddenStudentIds.length === 1 ? "" : "s"} hidden
            from TV. Use Hide on TV in the roster for a fast toggle.
          </p>
          {store.hiddenStudentIds.length ? (
            <div className="admin-chips" style={{ marginTop: 8 }}>
              {store.hiddenStudentIds
                .filter((id) => scopedStudents.some((student) => student.id === id))
                .map((id) => (
                  <button
                    key={id}
                    className="chip danger on"
                    type="button"
                    onClick={() => save(toggleHiddenStudent(store, id))}
                  >
                    Unhide {id}
                  </button>
                ))}
            </div>
          ) : null}
        </section>

        <section className="admin-card">
          <h2>Freeze ranks</h2>
          <p className="hint">
            Lock the current walk-on order so live dummy totals cannot reshuffle mid-ceremony.
            TV shows a gold RANKS FROZEN bar. Unfreeze restores live ranking.
          </p>
          {instituteFrozen && !institute ? (
            <p className="hint">Institute admin froze all boards. Campus managers cannot unfreeze that.</p>
          ) : (
            <button
              className={`chip ${frozenHere ? "on" : ""}`}
              type="button"
              onClick={() =>
                save(
                  frozenHere
                    ? unfreezeStore(store, freezeScopes)
                    : freezeStore(store, students, freezeScopes),
                )
              }
            >
              {frozenHere ? "Unfreeze ranks" : institute ? "Freeze all ranks" : "Freeze this campus"}
            </button>
          )}
        </section>

        <section className="admin-card">
          <h2>Pin physical TV</h2>
          <p className="hint">
            Assign the unlisted kiosk <code>/tv/u/afi-salon-tv</code> to a campus. The default
            sticks in this browser. Institute slideshow stays available for institute admin.
          </p>
          <div className="admin-chips">
            {(institute
              ? (["north", "south", "institute"] as KioskPin[])
              : ([myCampus ?? "north"] as KioskPin[])
            ).map((pin) => (
              <button
                key={pin}
                className={`chip ${store.kioskPin === pin ? "on" : ""}`}
                type="button"
                onClick={() => save({ ...store, kioskPin: pin })}
              >
                {pin === "institute"
                  ? "Institute slideshow"
                  : CAMPUS_LABELS[pin]}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Current pin:{" "}
            {store.kioskPin === "institute"
              ? "North → South → All Institute"
              : CAMPUS_LABELS[store.kioskPin]}
          </p>
        </section>

        <section className="admin-card">
          <h2>Quiet hours</h2>
          <p className="hint">
            After close, stop slide flipping and paging. Board can sit on a calm branding screen
            or the last slide. Dummy window 21:00–07:00 (overnight); off until you enable it.
          </p>
          {institute ? (
            <>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={store.quietHoursEnabled}
                  onChange={(event) => save({ ...store, quietHoursEnabled: event.target.checked })}
                />
                Enable quiet hours
              </label>
              <div className="admin-inline">
                <div className="field">
                  <label htmlFor="quietStart">Start</label>
                  <input
                    id="quietStart"
                    type="time"
                    value={store.quietStart}
                    onChange={(event) => save({ ...store, quietStart: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="quietEnd">End</label>
                  <input
                    id="quietEnd"
                    type="time"
                    value={store.quietEnd}
                    onChange={(event) => save({ ...store, quietEnd: event.target.value })}
                  />
                </div>
              </div>
              <div className="admin-chips">
                <button
                  className={`chip ${store.quietDisplay === "branding" ? "on" : ""}`}
                  type="button"
                  onClick={() => save({ ...store, quietDisplay: "branding" })}
                >
                  Branding screen
                </button>
                <button
                  className={`chip ${store.quietDisplay === "last" ? "on" : ""}`}
                  type="button"
                  onClick={() => save({ ...store, quietDisplay: "last" })}
                >
                  Hold last slide
                </button>
              </div>
            </>
          ) : (
            <p className="hint">
              Quiet hours {store.quietHoursEnabled ? "on" : "off"} · {store.quietStart}–{store.quietEnd} ·{" "}
              {store.quietDisplay}. Institute admin can change this.
            </p>
          )}
        </section>

        <section className="admin-card">
          <h2>Type size</h2>
          <p className="hint">
            Bigger or smaller for real TVs. Default is the last clean mid-size board (24px names,
            reserved name/points columns, HF chip under the rank). No service/retail badges.
          </p>
          <div className="admin-chips">
            {(
              [
                [-1, "Smaller"],
                [0, "Default"],
                [1, "Larger"],
              ] as Array<[TvTypeStep, string]>
            ).map(([step, label]) => (
              <button
                key={step}
                className={`chip ${store.typeStep === step ? "on" : ""}`}
                type="button"
                onClick={() => save({ ...store, typeStep: clampTypeStep(step) })}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {institute ? (
          <section className="admin-card">
            <h2>Date range / data pull</h2>
            <p className="hint">
              Recompute current-cycle rankings from dummy ticket/sales data in this range.
              Points stay 1 pt per $1 service and 5 pts per $1 retail.
            </p>
            <div className="admin-inline">
              <div className="field">
                <label htmlFor="cycleStart">Start</label>
                <input
                  id="cycleStart"
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="cycleEnd">End</label>
                <input
                  id="cycleEnd"
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </div>
            </div>
            <button className="btn" type="button" onClick={applyPull}>
              Apply / pull dummy tickets
            </button>
          </section>
        ) : null}

        <section className="admin-card">
          <h2>Manual TV display</h2>
          <p className="hint">
            {institute
              ? "Force the unlisted slideshow, or leave it on auto-rotate."
              : "Campus managers can only force their own campus board."}
          </p>
          <div className="admin-chips">
            {forceOptions.map(([key, label]) => (
              <button
                key={key}
                className={`chip ${store.forceSlide === key ? "on" : ""}`}
                type="button"
                onClick={() => save({ ...store, forceSlide: key })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="admin-inline" style={{ marginTop: 16 }}>
            <button
              className="btn ghost"
              type="button"
              onClick={() => save({ ...store, paused: !store.paused })}
            >
              {store.paused ? "Resume auto-rotate" : "Pause auto-rotate"}
            </button>
            {institute ? (
              <>
                <div className="field">
                  <label htmlFor="hold">Campus / list hold (sec)</label>
                  <input
                    id="hold"
                    type="number"
                    min={3}
                    max={60}
                    value={store.pageHoldSeconds}
                    onChange={(event) =>
                      save({ ...store, pageHoldSeconds: Number(event.target.value) || 7 })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="alltime">All-Time interval (sec)</label>
                  <input
                    id="alltime"
                    type="number"
                    min={15}
                    max={300}
                    value={store.allTimeAfterSeconds}
                    onChange={(event) =>
                      save({ ...store, allTimeAfterSeconds: Number(event.target.value) || 60 })
                    }
                  />
                </div>
              </>
            ) : null}
          </div>
        </section>

        {institute ? (
          <section className="admin-card">
            <h2>Board options</h2>
            <div className="field">
              <label htmlFor="cutoff">High Five cutoff (top N)</label>
              <input
                id="cutoff"
                type="number"
                min={1}
                max={20}
                value={store.highFiveCutoff}
                onChange={(event) =>
                  save({ ...store, highFiveCutoff: Number(event.target.value) || 5 })
                }
              />
            </div>
            <p className="kicker">Programs on TV</p>
            <div className="admin-chips">
              {PROGRAMS.map((program) => {
                const hidden = store.hiddenPrograms.includes(program);
                return (
                  <button
                    key={program}
                    className={`chip ${hidden ? "" : "on"}`}
                    type="button"
                    onClick={() => {
                      const hiddenPrograms = hidden
                        ? store.hiddenPrograms.filter((item) => item !== program)
                        : [...store.hiddenPrograms, program];
                      save({ ...store, hiddenPrograms });
                    }}
                  >
                    {hidden ? "Hidden · " : ""}
                    {PROGRAM_LABELS[program]}
                  </button>
                );
              })}
            </div>
            <p className="kicker" style={{ marginTop: 16 }}>
              Campuses on slideshow
            </p>
            <div className="admin-chips">
              {CAMPUSES.map((campus) => {
                const hidden = store.hiddenCampuses.includes(campus);
                return (
                  <button
                    key={campus}
                    className={`chip ${hidden ? "" : "on"}`}
                    type="button"
                    onClick={() => {
                      const hiddenCampuses = hidden
                        ? store.hiddenCampuses.filter((item) => item !== campus)
                        : [...store.hiddenCampuses, campus];
                      save({ ...store, hiddenCampuses });
                    }}
                  >
                    {hidden ? "Hidden · " : ""}
                    {CAMPUS_LABELS[campus]}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="admin-card">
          <h2>Reset the board</h2>
          <p className="hint">
            {institute
              ? "Current-cycle reset zeros this-cycle service and retail. Career / all-time dummy history stays unless you use the separate all-time reset."
              : "Campus managers can zero this-cycle totals for their campus only."}
          </p>
          {confirmCycle ? (
            <div className="admin-inline">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (institute) {
                    save({ ...store, cycleCleared: true, cycleTotals: {} });
                    setConfirmCycle(false);
                  } else {
                    resetCampusCycle();
                  }
                }}
              >
                {institute ? "Confirm reset current cycle" : "Confirm reset this campus cycle"}
              </button>
              <button className="btn ghost" type="button" onClick={() => setConfirmCycle(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn ghost" type="button" onClick={() => setConfirmCycle(true)}>
              {institute ? "Reset current cycle" : "Reset this campus cycle"}
            </button>
          )}
          {institute && confirmCareer ? (
            <div className="admin-inline" style={{ marginTop: 12 }}>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  save({ ...store, careerCleared: true });
                  setConfirmCareer(false);
                }}
              >
                Confirm reset all-time (dummy)
              </button>
              <button className="btn ghost" type="button" onClick={() => setConfirmCareer(false)}>
                Cancel
              </button>
            </div>
          ) : institute ? (
            <button
              className="btn ghost"
              type="button"
              style={{ marginTop: 12 }}
              onClick={() => setConfirmCareer(true)}
            >
              Reset all-time (dummy)
            </button>
          ) : null}
          {institute ? (
            <button
              className="btn ghost"
              type="button"
              style={{ marginTop: 12 }}
              onClick={() => {
                const next = defaultAdminStore(data);
                save(next);
                setStart(next.cycleStart);
                setEnd(next.cycleEnd);
              }}
            >
              Restore dummy seed settings
            </button>
          ) : null}
        </section>
      </div>

      {institute ? (
        <section className="admin-card">
          <div className="admin-row-head">
            <h2>Ticker</h2>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={store.tickerEnabled}
                onChange={(event) => save({ ...store, tickerEnabled: event.target.checked })}
              />
              Enable ticker
            </label>
          </div>
          <div className="admin-ticker-list">
            {store.sponsors.map((item, index) => (
              <div className="admin-ticker-row" key={item.id}>
                <input
                  value={item.name}
                  onChange={(event) => updateTicker(index, { name: event.target.value })}
                  aria-label="Ticker name"
                />
                <input
                  value={item.line}
                  onChange={(event) => updateTicker(index, { line: event.target.value })}
                  aria-label="Ticker line"
                />
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) => updateTicker(index, { enabled: event.target.checked })}
                  />
                  On
                </label>
                <button className="btn ghost" type="button" onClick={() => moveTicker(index, -1)}>
                  Up
                </button>
                <button className="btn ghost" type="button" onClick={() => moveTicker(index, 1)}>
                  Down
                </button>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() =>
                    save({
                      ...store,
                      sponsors: store.sponsors.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn ghost"
            type="button"
            onClick={() =>
              save({
                ...store,
                sponsors: [
                  ...store.sponsors,
                  {
                    id: `s${Date.now()}`,
                    name: "New message",
                    line: "Dummy ticker line",
                    enabled: true,
                  },
                ],
              })
            }
          >
            Add ticker message
          </button>
        </section>
      ) : null}

      <section className="admin-card">
        <div className="admin-row-head">
          <h2>Student roster / opt-in</h2>
          <input
            className="admin-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, campus, program, student ID"
          />
        </div>
        <form className="admin-add" onSubmit={addStudent}>
          <input
            value={add.firstName}
            onChange={(event) => setAdd({ ...add, firstName: event.target.value })}
            placeholder="First name"
            required
          />
          <input
            value={add.lastName}
            onChange={(event) => setAdd({ ...add, lastName: event.target.value })}
            placeholder="Last name"
            required
          />
          <input
            value={add.id}
            onChange={(event) => setAdd({ ...add, id: event.target.value })}
            placeholder="ID (optional)"
          />
          {institute ? (
            <select
              value={add.campus}
              onChange={(event) => setAdd({ ...add, campus: event.target.value as Campus })}
            >
              {CAMPUSES.map((campus) => (
                <option key={campus} value={campus}>
                  {CAMPUS_LABELS[campus]}
                </option>
              ))}
            </select>
          ) : (
            <input value={CAMPUS_LABELS[myCampus ?? "north"]} readOnly />
          )}
          <select
            value={add.program}
            onChange={(event) => setAdd({ ...add, program: event.target.value as Program })}
          >
            {PROGRAMS.map((program) => (
              <option key={program} value={program}>
                {PROGRAM_LABELS[program]}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            Add dummy student
          </button>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Campus</th>
                <th>Program</th>
                <th>Opt-in</th>
                <th>TV</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const hidden = store.hiddenStudentIds.includes(student.id);
                return (
                  <tr key={student.id}>
                    <td>
                      {student.firstName} {student.lastName}
                    </td>
                    <td>{student.id}</td>
                    <td>{CAMPUS_LABELS[student.campus]}</td>
                    <td>{PROGRAM_LABELS[student.program]}</td>
                    <td>{student.optedIn ? "Opted in" : "Opted out"}</td>
                    <td>{hidden ? "Hidden" : student.optedIn ? "Name on" : "Student ID"}</td>
                    <td>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => setOpt(student.id, !student.optedIn)}
                      >
                        {student.optedIn ? "Opt Out" : "Opt In"}
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => save(toggleHiddenStudent(store, student.id))}
                      >
                        {hidden ? "Show on TV" : "Hide on TV"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="hint">
          {filtered.length} students in this list. Opted-out names never appear on TV (Student ID
          only). Panic-hidden students are omitted entirely.
        </p>
      </section>
    </main>
  );
}
