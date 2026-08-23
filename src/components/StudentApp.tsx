"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CAMPUS_LABELS,
  PROGRAM_LABELS,
  displayCycleWeek,
  displayName,
  findStudent,
  findStudentByLogin,
  formatCycleRange,
  formatMoney,
  formatPoints,
  rankStudents,
  studentPoints,
} from "@/lib/leaderboard";
import { data } from "@/lib/data";
import { adminCycle, composeStudents, readAdminStore } from "@/lib/admin-store";
import {
  clearSession,
  readConsentOverrides,
  readSession,
  writeConsent,
  writeSession,
} from "@/lib/session";

function liveStudents() {
  return composeStudents(data.students, readAdminStore(data), readConsentOverrides());
}

export function LoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (readSession()) router.replace("/consent");
  }, [router]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const account = findStudentByLogin(liveStudents(), studentId, lastName);
    if (!account) {
      setError("Dummy login failed. Use a listed student ID and last name.");
      return;
    }
    writeSession(account.id);
    router.push("/consent");
  }

  return (
    <main className="auth">
      <div className="auth-inner">
        <p className="notice">Dummy sign-in · student ID + last name · not production</p>
        <p className="kicker">Avenue Five Institute</p>
        <h1>High Five Awards Opt-in</h1>
        <p className="lede">
          Dummy sign-in for the High Five Awards. Enter a student ID and last name,
          then choose Opt In or Opt Out. Rankings use points: 1 pt per $1 service,
          5 pts per $1 retail. This does not connect to a real student system.
        </p>
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              name="studentId"
              autoComplete="username"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="AFI-2401"
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Reyes"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Continue
          </button>
        </form>
        <div className="dummy-accounts" style={{ marginTop: 22 }}>
          <p className="kicker">Dummy accounts</p>
          <p className="hint">
            <code>AFI-2401</code> / <code>Reyes</code> · Jordan · Cosmetology, North Austin Campus, opted in
            <br />
            <code>AFI-2402</code> / <code>Cruz</code> · Riley · Esthetics, South Austin Campus, opted in
            <br />
            <code>AFI-2403</code> / <code>Miles</code> · Casey · Barbering, North Austin Campus, opted in
          </p>
        </div>
      </div>
    </main>
  );
}

export function ConsentForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [students, setStudents] = useState(data.students);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setStudentId(session);
    setStudents(liveStudents());
  }, [router]);

  const student = studentId ? findStudent(students, studentId) : undefined;

  if (!studentId) return null;
  if (!student) {
    return (
      <main className="student-page">
        <div className="student-inner">
          <p>Dummy session is missing a matching student. Please sign in again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="student-page">
      <div className="student-inner consent-copy">
        <p className="notice">Dummy only · no production deploy</p>
        <p className="kicker">Avenue Five Institute</p>
        <h1>High Five Awards Opt-in</h1>
        <p>
          The High Five Awards is Avenue Five Institute’s student salon contest. Rankings use service and retail results for the current class cycle.
        </p>
        <p>
          By choosing Opt In, you agree that Avenue Five Institute may display your full name, program schedule, and relevant performance statistics. This information may be displayed on campus and may be available to other students who have opted in.
        </p>
        <p>
          Participation is voluntary. Opting in or out does not affect your enrollment, grades, attendance, or financial aid.
        </p>
        <p>
          You may change your choice at any time by signing in again and selecting Opt In or Opt Out. If you opt out, your results may still be counted in the contest, but your name will not be shown.
        </p>
        <p>If you do not agree, choose Opt Out.</p>
        <p className="hint">
          Dummy status now: {student.optedIn ? "Opt In" : "Opt Out"}.
        </p>
        <div className="consent-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              writeConsent(student.id, true);
              router.push("/student");
            }}
          >
            Opt In
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              writeConsent(student.id, false);
              router.push("/student");
            }}
          >
            Opt Out
          </button>
        </div>
      </div>
    </main>
  );
}

export function StudentDashboard() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [scope, setScope] = useState<"campus" | "institute">("campus");
  const [students, setStudents] = useState(data.students);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setStudentId(session);
    setStudents(liveStudents());
  }, [router]);

  const student = studentId ? findStudent(students, studentId) : undefined;
  const cutoff = readAdminStore(data).highFiveCutoff;
  const campusBoard = useMemo(
    () =>
      student
        ? rankStudents(students, {
            program: student.program,
            campus: student.campus,
            highFiveSize: cutoff,
          })
        : [],
    [student, students, cutoff],
  );
  const instituteBoard = useMemo(
    () =>
      student
        ? rankStudents(students, { program: student.program, highFiveSize: cutoff })
        : [],
    [student, students, cutoff],
  );
  const careerBoard = useMemo(
    () =>
      student
        ? rankStudents(students, {
            program: student.program,
            score: "career",
            highFiveSize: cutoff,
          })
        : [],
    [student, students, cutoff],
  );

  if (!studentId) return null;
  if (!student) {
    return (
      <main className="student-page">
        <div className="student-inner">
          <p>Dummy session is missing a matching student. Please sign in again.</p>
          <button
            className="btn ghost"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  const board = scope === "campus" ? campusBoard : instituteBoard;
  const me = board.find((row) => row.id === student.id);
  const cycle = adminCycle(readAdminStore(data));
  const week = displayCycleWeek(cycle);

  return (
    <main className="student-page">
      <div className="student-inner">
        <div className="topbar">
          <div>
            <p className="kicker">High Five Competition · private student view</p>
            <h1 style={{ margin: 0 }}>{displayName(student)}</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn ghost" href="/consent" style={{ textDecoration: "none" }}>
              Consent
            </Link>
            <button
              className="btn ghost"
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <section className="student-hero">
          <div>
            <p className="kicker">
              {PROGRAM_LABELS[student.program]} · {CAMPUS_LABELS[student.campus]}
            </p>
            <p className="big-rank">
              #{me?.rank ?? "—"}
              {me ? (
                <span className={`rank-arrow ${me.rankDelta >= 0 ? "up" : "down"}`} style={{ fontSize: 36, marginLeft: 12 }}>
                  {me.rankDelta > 0 ? `▲${me.rankDelta}` : me.rankDelta < 0 ? `▼${Math.abs(me.rankDelta)}` : ""}
                </span>
              ) : null}
            </p>
            <p className="lede">
              Ranked by points only within {PROGRAM_LABELS[student.program]} (1 pt per $1 service, 5 pts per $1 retail). Campus rank #{campusBoard.find((row) => row.id === student.id)?.campusRank} of {campusBoard.length}.
              {me?.highFive ? " High Five award winner for this program at this campus." : " Not in this campus program High Five (top five)."}
            </p>
            <p className="hint">
              Cycle: {formatCycleRange(cycle)} · week {week} of {cycle.weeks}
            </p>
            <p className="hint">
              All-time #{careerBoard.find((row) => row.id === student.id)?.rank ?? "—"} of {careerBoard.length} in {PROGRAM_LABELS[student.program]}
              {" · "}
              {formatPoints(studentPoints({ service: student.careerService, retail: student.careerRetail }))} career
            </p>
          </div>
          <div className="student-totals">
            <p className="kicker">Your dummy points</p>
            <p className="total">{formatPoints(studentPoints(student))}</p>
            <p className="hint">
              S:{formatMoney(student.service)}&nbsp;&nbsp;R:{formatMoney(student.retail)}
            </p>
            <p className="hint">1 pt per $1 service · 5 pts per $1 retail</p>
            <p className="badges" style={{ marginTop: 12 }}>
              {me?.highFive ? <span className="badge highfive">High Five</span> : null}
            </p>
          </div>
        </section>

        <section className="student-board">
          <div className="topbar">
            <h2 style={{ margin: 0 }}>
              {PROGRAM_LABELS[student.program]} High Five
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn ghost"
                onClick={() => setScope("campus")}
                aria-pressed={scope === "campus"}
              >
                {CAMPUS_LABELS[student.campus]}
              </button>
              <button
                className="btn ghost"
                onClick={() => setScope("institute")}
                aria-pressed={scope === "institute"}
              >
                All institute
              </button>
            </div>
          </div>
          {board.map((row) => {
            const highFiveClass = row.rank === 1
              ? "high-five-lead"
              : row.highFive
                ? "high-five-set"
                : "rank-rest";
            return (
              <div className={`student-row ${row.id === student.id ? "me" : ""} ${highFiveClass}`} key={row.id}>
                <div className="rank-cluster">
                  <div className="rank">{row.rank}</div>
                  {row.rankDelta > 0 ? <span className="rank-arrow up">▲{row.rankDelta}</span> : null}
                  {row.rankDelta < 0 ? <span className="rank-arrow down">▼{Math.abs(row.rankDelta)}</span> : null}
                </div>
                <div>
                  <div className="name">{row.displayName}</div>
                  <div className="hint">
                    {row.campus === "north" ? "North Austin Campus" : "South Austin Campus"}
                    {row.highFive ? " · High Five" : ""}
                  </div>
                </div>
                <div className="money">
                  <div className="total" style={{ fontSize: 28 }}>
                    {formatPoints(row.points)}
                  </div>
                  <div className="split">
                    S:{formatMoney(row.service)}&nbsp;&nbsp;R:{formatMoney(row.retail)}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
        <p className="hint">
          <Link href="/">Back to reviewer hub</Link>
          {" · "}
          Dummy data only. Names here are fictional.
        </p>
      </div>
    </main>
  );
}
