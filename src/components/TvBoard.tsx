"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPUS_LABELS,
  CAMPUS_SHORT,
  PROGRAMS,
  PROGRAM_LABELS,
  campusTotals,
  cycleWeek,
  formatCycleRange,
  formatMoney,
  listPageWindow,
  rankAllPrograms,
  resolveCycle,
  type Campus,
  type Program,
  applyConsent,
  type RankedStudent,
} from "@/lib/leaderboard";
import { data } from "@/lib/data";
import { readConsentOverrides } from "@/lib/session";

const PAGE_HOLD_MS = 7000;
const MIN_ROW_HEIGHT = 50;

export type TvMode = "slideshow" | "north" | "south";

function RankArrow({ delta }: { delta: number }) {
  if (delta > 0) return <span className="rank-arrow up">▲{delta}</span>;
  if (delta < 0) return <span className="rank-arrow down">▼{Math.abs(delta)}</span>;
  return null;
}

function RankRow({
  student,
  showCampus,
  rowHeight,
}: {
  student: RankedStudent;
  showCampus?: boolean;
  rowHeight: number;
}) {
  const y = (student.rank - 1) * rowHeight;
  const moved = student.rankDelta > 0 ? "moved-up" : student.rankDelta < 0 ? "moved-down" : "";
  const highFiveClass = student.rank === 1
    ? "high-five-lead"
    : student.rank <= 5
      ? "high-five-set"
      : "rank-rest";

  return (
    <article
      className={`row rank-${student.rank} ${highFiveClass} ${moved}`}
      style={{ height: rowHeight, transform: `translateY(${y}px)`, zIndex: 80 - student.rank }}
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
  listPage,
  onFit,
}: {
  program: Program;
  rows: RankedStudent[];
  showCampus?: boolean;
  listPage: number;
  onFit?: (count: number) => void;
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

  useEffect(() => {
    onFit?.(fit.count);
  }, [fit.count, onFit]);

  const pageWindow = listPageWindow(rows.length, fit.count, listPage);
  const shiftY = pageWindow.page * fit.count * fit.rowHeight;
  const rangeLabel = rows.length
    ? `${pageWindow.start + 1}–${pageWindow.end} of ${rows.length}`
    : "0";

  return (
    <section className={`program-col ${program}`}>
      <header>
        <div>
          <h2>{PROGRAM_LABELS[program]}</h2>
          <p className="highfive-label">High Five = ranks 1–5</p>
        </div>
        <span className="count">{rangeLabel}</span>
      </header>
      <div className="track" ref={trackRef}>
        <div
          className="track-shift"
          style={{ transform: `translateY(-${shiftY}px)` }}
        >
          {rows.map((student) => (
            <RankRow
              key={student.id}
              student={student}
              showCampus={showCampus}
              rowHeight={fit.rowHeight}
            />
          ))}
        </div>
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

function Board({
  campus,
  institute,
  onPageCycle,
}: {
  campus?: Campus;
  institute?: boolean;
  onPageCycle?: () => void;
}) {
  const [students, setStudents] = useState(data.students);
  const [listPage, setListPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const reportFit = useCallback((count: number) => {
    setPageSize((current) => (current === count ? current : count));
  }, []);

  useEffect(() => {
    setStudents(applyConsent(data.students, readConsentOverrides()));
  }, []);

  const boards = useMemo(
    () => rankAllPrograms(students, campus),
    [students, campus],
  );
  const maxPages = Math.max(
    1,
    ...PROGRAMS.map((program) => listPageWindow(boards[program].length, pageSize, 0).pageCount),
  );
  const title = institute
    ? "All Institute"
    : campus
      ? CAMPUS_LABELS[campus]
      : "High Five";
  const subtitle = institute
    ? "North Austin Campus vs South Austin Campus · High Five is ranks 1–5 in each program at each campus"
    : "Private High Five Competition · ranked only within program";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setListPage((current) => current + 1);
    }, PAGE_HOLD_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (onPageCycle && listPage > 0 && listPage % maxPages === 0) {
      onPageCycle();
    }
  }, [listPage, maxPages, onPageCycle]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        setListPage((current) => current + 1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        setListPage((current) => current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
            listPage={listPage}
            onFit={program === PROGRAMS[0] ? reportFit : undefined}
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

  const advanceSlide = useCallback(() => {
    if (slides.length < 2) return;
    setIndex((current) => (current + 1) % slides.length);
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
      <Board
        key={slide.key}
        campus={slide.campus}
        institute={slide.institute}
        onPageCycle={mode === "slideshow" ? advanceSlide : undefined}
      />
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
