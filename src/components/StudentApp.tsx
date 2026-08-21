"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CAMPUS_LABELS,
  PROGRAM_LABELS,
  cycleWeek,
  displayName,
  findAccount,
  findStudent,
  formatMoney,
  rankStudents,
  studentTotal,
} from "@/lib/leaderboard";
import { data } from "@/lib/data";
import { clearSession, readSession, writeSession } from "@/lib/session";

export function LoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (readSession()) router.replace("/student");
  }, [router]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const account = findAccount(data.accounts, studentId, pin);
    if (!account) {
      setError("Dummy login failed. Use a listed student ID and PIN.");
      return;
    }
    writeSession(account.id);
    router.push("/student");
  }

  return (
    <main className="auth">
      <div className="auth-inner">
        <p className="notice">Dummy auth stub · student ID + PIN · not production</p>
        <p className="kicker">Avenue Five Institute</p>
        <h1>Student salon login</h1>
        <p className="lede">
          Web view only for this dummy. Enter a fictional student ID and PIN.
          This does not connect to a real student system.
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
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="4-digit dummy PIN"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Sign in
          </button>
        </form>
        <div className="dummy-accounts" style={{ marginTop: 22 }}>
          <p className="kicker">Dummy accounts</p>
          <p className="hint">
            <code>AFI-2401</code> / <code>1357</code> · Jordan R. · Cosmetology, North, opted in
            <br />
            <code>AFI-2402</code> / <code>2468</code> · not opted in · Aesthetics, South
            <br />
            <code>AFI-2403</code> / <code>8024</code> · Casey M. · Barbering, North, most retail
          </p>
        </div>
      </div>
    </main>
  );
}

export function StudentDashboard() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [scope, setScope] = useState<"campus" | "institute">("campus");

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setStudentId(session);
  }, [router]);

  const student = studentId ? findStudent(data.students, studentId) : undefined;
  const campusBoard = useMemo(
    () =>
      student
        ? rankStudents(data.students, { program: student.program, campus: student.campus })
        : [],
    [student],
  );
  const instituteBoard = useMemo(
    () => (student ? rankStudents(data.students, { program: student.program }) : []),
    [student],
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
  const week = cycleWeek(data.cycle);

  return (
    <main className="student-page">
      <div className="student-inner">
        <div className="topbar">
          <div>
            <p className="kicker">Private student view</p>
            <h1 style={{ margin: 0 }}>{displayName(student)}</h1>
          </div>
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

        <section className="student-hero">
          <div>
            <p className="kicker">
              {PROGRAM_LABELS[student.program]} · {CAMPUS_LABELS[student.campus]}
            </p>
            <p className="big-rank">#{me?.rank ?? "—"}</p>
            <p className="lede">
              Ranked only within {PROGRAM_LABELS[student.program]}. Campus rank #{campusBoard.find((row) => row.id === student.id)?.rank} of {campusBoard.length}.
              Institute rank #{instituteBoard.find((row) => row.id === student.id)?.rank} of {instituteBoard.length}.
            </p>
            <p className="hint">
              Cycle: {data.cycle.label} · week {week} of {data.cycle.weeks} · resets {data.cycle.endDate}
            </p>
          </div>
          <div className="student-totals">
            <p className="kicker">Your dummy total</p>
            <p className="total">{formatMoney(studentTotal(student))}</p>
            <p className="hint">
              S:{formatMoney(student.service)}&nbsp;&nbsp;R:{formatMoney(student.retail)}
            </p>
            <p className="badges" style={{ marginTop: 12 }}>
              {(me?.rankDelta ?? 0) > 0 ? <span className="badge up">▲ {me?.rankDelta}</span> : null}
              {(me?.rankDelta ?? 0) < 0 ? <span className="badge down">▼ {Math.abs(me?.rankDelta ?? 0)}</span> : null}
              {me?.badges.mostRetail ? <span className="badge retail">Most retail</span> : null}
              {me?.badges.mostServices ? <span className="badge service">Most services</span> : null}
            </p>
          </div>
        </section>

        <section className="student-board">
          <div className="topbar">
            <h2 style={{ margin: 0 }}>
              {PROGRAM_LABELS[student.program]} board
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
          {board.map((row) => (
            <div className={`student-row ${row.id === student.id ? "me" : ""}`} key={row.id}>
              <div className="rank">{row.rank}</div>
              <div>
                <div className="name">{row.displayName}</div>
                <div className="hint">
                  {row.campus === "north" ? "North" : "South"}
                  {row.rankDelta > 0 ? ` · ▲ ${row.rankDelta}` : ""}
                  {row.rankDelta < 0 ? ` · ▼ ${Math.abs(row.rankDelta)}` : ""}
                  {row.badges.mostRetail ? " · Most retail" : ""}
                  {row.badges.mostServices ? " · Most services" : ""}
                </div>
              </div>
              <div className="money">
                <div className="total" style={{ fontSize: 28 }}>
                  {formatMoney(row.total)}
                </div>
                <div className="split">
                  S:{formatMoney(row.service)}&nbsp;&nbsp;R:{formatMoney(row.retail)}
                </div>
              </div>
            </div>
          ))}
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
