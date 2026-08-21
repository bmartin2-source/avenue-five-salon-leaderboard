"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPUS_LABELS,
  CAMPUS_SHORT,
  PROGRAMS,
  PROGRAM_LABELS,
  campusTotals,
  cycleWeek,
  formatCycleRange,
  formatMoney,
  rankAllPrograms,
  resolveCycle,
  type Campus,
  type Program,
  applyConsent,
  type RankedStudent,
} from "@/lib/leaderboard";
import { data } from "@/lib/data";
import { readConsentOverrides } from "@/lib/session";

const SLIDE_MS = 9000;
const MIN_ROW_HEIGHT = 50;

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

function RankArrow({ delta }: { delta: number }) {
  if (delta > 0) return <span className="rank-arrow up">▲{delta}</span>;
  if (delta < 0) return <span className="rank-arrow down">▼{Math.abs(delta)}</span>;
  return null;
}

function RankRow({
  student,
  index,
  showCampus,
  phase,
  rowHeight,
}: {
  student: RankedStudent;
  index: number;
  showCampus?: boolean;
  phase: "from" | "to";
  rowHeight: number;
}) {
  const visualRank = phase === "from" ? student.previousRank : student.rank;
  const y = (visualRank - 1) * rowHeight;
  const moved = student.rankDelta > 0 ? "moved-up" : student.rankDelta < 0 ? "moved-down" : "";
  const highFiveClass = student.rank === 1
    ? "high-five-lead"
    : student.rank <= 5
      ? "high-five-set"
      : "rank-rest";

  return (
    <article
      className={`row rank-${student.rank} ${highFiveClass} ${moved}`}
      style={{ height: rowHeight, transform: `translateY(${y}px)`, zIndex: 20 - index }}
    >
      <div className="rank-cluster">
        <div className="rank">{student.rank}</div>
        <RankArrow delta={student.rankDelta} />
      </div>
      <div className="who">
        <span className="name">{student.displayName}</span>
        {showCampus ? <span className="campus-tag">{CAMPUS_SHORT[student.campus]}</span> : null}
      </div>
      <div className="end">
        {student.rank <= 5 ? <span className="badge highfive">High Five</span> : null}
        {student.badges.mostRetail ? <span className="badge retail">Retail</span> : null}
        {student.badges.mostServices ? <span className="badge service">Services</span> : null}
        <div className="money">
          <div className="total">{formatMoney(student.total)}</div>
          <div className="split">
            S:{formatMoney(student.service)}&nbsp;&nbsp;R:{formatMoney(student.retail)}
          </div>
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ count: 15, rowHeight: 52 });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const height = el.clientHeight;
      const count = Math.max(1, Math.floor(height / MIN_ROW_HEIGHT));
      const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor(height / count));
      setFit({ count, rowHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visible = rows.slice(0, fit.count);
  const phase = useAnimatedRanks(visible);
  return (
    <section className={`program-col ${program}`}>
      <header>
        <div>
          <h2>{PROGRAM_LABELS[program]}</h2>
          <p className="highfive-label">High Five = ranks 1–5</p>
        </div>
        <span className="count">{rows.length}</span>
      </header>
      <div className="track" ref={trackRef}>
        {visible.map((student, index) => (
          <RankRow
            key={student.id}
            student={student}
            index={index}
            showCampus={showCampus}
            phase={phase}
            rowHeight={fit.rowHeight}
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
  const cycle = resolveCycle(data);
  const asOf = data.asOf ? new Date(`${data.asOf}T12:00:00`) : new Date();
  const week = cycleWeek(cycle, asOf);
  return (
    <div className="cycle-chip">
      <div className="cycle-dates">{formatCycleRange(cycle)}</div>
      <div className="cycle-week">
        Week {week} of {cycle.weeks}
      </div>
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
          <div className="campus">North Austin Campus</div>
          <div className="program-leads" style={{ justifyContent: "flex-start", marginTop: 2 }}>
            S:{formatMoney(north.service)} · R:{formatMoney(north.retail)}
          </div>
        </div>
        <div className="amount">{formatMoney(north.total)}</div>
      </div>
      <div className="vs">VS</div>
      <div className="score south">
        <div>
          <div className="campus">South Austin Campus</div>
          <div className="program-leads" style={{ justifyContent: "flex-end", marginTop: 2 }}>
            S:{formatMoney(south.service)} · R:{formatMoney(south.retail)}
          </div>
        </div>
        <div className="amount">{formatMoney(south.total)}</div>
      </div>
    </div>
  );
}

function Board({ campus, institute }: { campus?: Campus; institute?: boolean }) {
  const [students, setStudents] = useState(data.students);

  useEffect(() => {
    setStudents(applyConsent(data.students, readConsentOverrides()));
  }, []);

  const boards = useMemo(
    () => rankAllPrograms(students, campus),
    [students, campus],
  );
  const title = institute
    ? "All Institute"
    : campus
      ? CAMPUS_LABELS[campus]
      : "High Five";
  const subtitle = institute
    ? "North Austin Campus vs South Austin Campus · High Five is ranks 1–5 in each program at each campus"
    : "Private High Five Competition · ranked only within program";

  return (
    <>
      <header className="tv-header">
        <div className="brand">
          <div className="mark">A5</div>
          <div className="brand-copy">
            <p className="name">Avenue Five</p>
            <p className="sub">High Five Competition · Private</p>
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
      ) : null}
      <SponsorTicker />
    </main>
  );
}
