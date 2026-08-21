"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CAMPUS_LABELS,
  PROGRAMS,
  PROGRAM_LABELS,
  campusTotals,
  cycleWeek,
  formatMoney,
  rankAllPrograms,
  type Campus,
  type Program,
  type RankedStudent,
} from "@/lib/leaderboard";
import { data } from "@/lib/data";

const ROW_HEIGHT = 92;
const SLIDE_MS = 9000;

export type TvMode = "slideshow" | "north" | "south";

function useAnimatedRanks(rows: RankedStudent[]) {
  const [phase, setPhase] = useState<"from" | "to">("from");
  const key = rows.map((row) => `${row.id}:${row.rank}:${row.previousRank}`).join("|");

  useEffect(() => {
    setPhase("from");
    const timer = window.setTimeout(() => setPhase("to"), 160);
    return () => window.clearTimeout(timer);
  }, [key]);

  return phase;
}

function RankRow({
  student,
  index,
  showCampus,
  phase,
}: {
  student: RankedStudent;
  index: number;
  showCampus?: boolean;
  phase: "from" | "to";
}) {
  const visualRank = phase === "from" ? student.previousRank : student.rank;
  const y = (visualRank - 1) * ROW_HEIGHT;
  const moved = student.rankDelta > 0 ? "moved-up" : student.rankDelta < 0 ? "moved-down" : "";

  return (
    <article
      className={`row rank-${student.rank} ${moved}`}
      style={{ transform: `translateY(${y}px)`, zIndex: 20 - index }}
    >
      <div className="rank">{student.rank}</div>
      <div className="who">
        <div className="name">{student.displayName}</div>
        <div className="meta">
          {showCampus ? <span>{student.campus === "north" ? "North" : "South"}</span> : null}
          <span className="badges">
            {student.rankDelta > 0 ? <span className="badge up">▲ {student.rankDelta}</span> : null}
            {student.rankDelta < 0 ? <span className="badge down">▼ {Math.abs(student.rankDelta)}</span> : null}
            {student.badges.mostRetail ? <span className="badge retail">Most retail</span> : null}
            {student.badges.mostServices ? <span className="badge service">Most services</span> : null}
          </span>
        </div>
      </div>
      <div className="money">
        <div className="total">{formatMoney(student.total)}</div>
        <div className="split">
          S:{formatMoney(student.service)}&nbsp;&nbsp;R:{formatMoney(student.retail)}
        </div>
      </div>
    </article>
  );
}

function ProgramColumn({
  program,
  rows,
  showCampus,
}: {
  program: Program;
  rows: RankedStudent[];
  showCampus?: boolean;
}) {
  const visible = rows.slice(0, 6);
  const phase = useAnimatedRanks(visible);

  return (
    <section className={`program-col ${program}`}>
      <header>
        <h2>{PROGRAM_LABELS[program]}</h2>
        <span className="count">Ranked in program · {rows.length}</span>
      </header>
      <div className="track" style={{ height: visible.length * ROW_HEIGHT }}>
        {visible.map((student, index) => (
          <RankRow
            key={student.id}
            student={student}
            index={index}
            showCampus={showCampus}
            phase={phase}
          />
        ))}
      </div>
    </section>
  );
}

function SponsorTicker() {
  const items = [...data.sponsors, ...data.sponsors];
  return (
    <div className="ticker" aria-label="Sponsor ticker">
      <div className="ticker-track">
        {items.map((sponsor, index) => (
          <div className="ticker-item" key={`${sponsor.id}-${index}`}>
            <strong>{sponsor.name}</strong>
            <span>{sponsor.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CycleChip() {
  const week = cycleWeek(data.cycle);
  return (
    <div className="cycle-chip">
      <strong>
        Week {week} of {data.cycle.weeks}
      </strong>
      <span>
        {data.cycle.label} · resets {data.cycle.endDate}
      </span>
    </div>
  );
}

function InstituteScoreboard() {
  const north = campusTotals(data.students, "north");
  const south = campusTotals(data.students, "south");
  return (
    <div className="scoreboard">
      <div className="score north">
        <div>
          <div className="campus">North</div>
          <div className="program-leads" style={{ justifyContent: "flex-start", marginTop: 4 }}>
            S:{formatMoney(north.service)} · R:{formatMoney(north.retail)}
          </div>
        </div>
        <div className="amount">{formatMoney(north.total)}</div>
      </div>
      <div className="vs">VS</div>
      <div className="score south">
        <div>
          <div className="campus">South</div>
          <div className="program-leads" style={{ justifyContent: "flex-end", marginTop: 4 }}>
            S:{formatMoney(south.service)} · R:{formatMoney(south.retail)}
          </div>
        </div>
        <div className="amount">{formatMoney(south.total)}</div>
      </div>
    </div>
  );
}

function Board({ campus, institute }: { campus?: Campus; institute?: boolean }) {
  const boards = useMemo(
    () => rankAllPrograms(data.students, campus),
    [campus],
  );
  const title = institute
    ? "All Institute"
    : campus
      ? CAMPUS_LABELS[campus]
      : "Student Salon";
  const subtitle = institute
    ? "Comparison slide · still ranked only within each program"
    : "Private student salon · ranked only within program";

  return (
    <>
      <header className="tv-header">
        <div className="brand">
          <div className="mark">A5</div>
          <div className="brand-copy">
            <p className="name">Avenue Five</p>
            <p className="sub">Student salon leaderboard · Private</p>
          </div>
        </div>
        <div className="board-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <CycleChip />
      </header>
      {institute ? <InstituteScoreboard /> : null}
      <div className="tv-columns">
        {PROGRAMS.map((program) => (
          <ProgramColumn
            key={program}
            program={program}
            rows={boards[program]}
            showCampus={institute}
          />
        ))}
      </div>
    </>
  );
}

export function TvBoard({ mode }: { mode: TvMode }) {
  const slides: Array<{ key: string; campus?: Campus; institute?: boolean }> =
    mode === "slideshow"
      ? [
          { key: "north", campus: "north" },
          { key: "south", campus: "south" },
          { key: "institute", institute: true },
        ]
      : [{ key: mode, campus: mode }];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % slides.length);
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <main className="tv-shell">
      <Board campus={slide.campus} institute={slide.institute} />
      {mode === "slideshow" ? (
        <div className="tv-dots" aria-hidden>
          {slides.map((item, slideIndex) => (
            <span key={item.key} className={`dot ${slideIndex === index ? "on" : ""}`} />
          ))}
        </div>
      ) : (
        <div className="tv-dots" />
      )}
      <SponsorTicker />
    </main>
  );
}
