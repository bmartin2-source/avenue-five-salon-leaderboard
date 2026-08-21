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
  formatPoints,
  balancedPageSize,
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
const ALL_TIME_AFTER_MS = 60_000;
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
  allTime,
}: {
  student: RankedStudent;
  showCampus?: boolean;
  rowHeight: number;
  allTime?: boolean;
}) {
  const y = (student.rank - 1) * rowHeight;
  const moved = !allTime && student.rankDelta > 0 ? "moved-up" : !allTime && student.rankDelta < 0 ? "moved-down" : "";
  const leadClass = student.rank === 1
    ? allTime ? "all-time-lead" : "high-five-lead"
    : student.rank <= 5
      ? allTime ? "all-time-set" : "high-five-set"
      : "rank-rest";
  const dollars = allTime
    ? { service: student.careerService, retail: student.careerRetail }
    : { service: student.service, retail: student.retail };

  return (
    <article
      className={`row rank-${student.rank} ${leadClass} ${moved}`}
      style={{ height: rowHeight, transform: `translateY(${y}px)`, zIndex: 80 - student.rank }}
    >
      <div className="rank-cluster">
        <div className="rank">{student.rank}</div>
        <div className="rank-side">
          {allTime ? null : <RankArrow delta={student.rankDelta} />}
          {student.rank <= 5 ? (
            <span className={`rank-mark ${allTime ? "alltime" : "highfive"}`}>
              {allTime ? "AT" : "HF"}
            </span>
          ) : null}
        </div>
      </div>
      <div className="who">
        <span className="name">{student.displayName}</span>
        {showCampus ? <span className="campus-tag">{CAMPUS_SHORT[student.campus]}</span> : null}
      </div>
      <div className="money">
        <div className="total">
          {student.points.toLocaleString("en-US")}
          <span className="pts"> pts</span>
        </div>
        <div className="split">
          S:{formatMoney(dollars.service)}&nbsp;&nbsp;R:{formatMoney(dollars.retail)}
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
  allTime,
}: {
  program: Program;
  rows: RankedStudent[];
  showCampus?: boolean;
  listPage: number;
  onFit?: (count: number) => void;
  allTime?: boolean;
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

  const pageSize = balancedPageSize(rows.length, fit.count);
  const pageWindow = listPageWindow(rows.length, pageSize, listPage);
  const shiftY = pageWindow.page * pageSize * fit.rowHeight;
  const rangeLabel = rows.length
    ? `${pageWindow.start + 1}–${pageWindow.end} of ${rows.length}`
    : "0";

  return (
    <section className={`program-col ${program}`}>
      <header>
        <div>
          <h2>{PROGRAM_LABELS[program]}</h2>
          <p className={`highfive-label ${allTime ? "alltime" : ""}`}>
            {allTime ? "All-time = career top 5" : "High Five = top 5 this cycle"}
          </p>
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
              allTime={allTime}
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

function CycleChip({ allTime }: { allTime?: boolean }) {
  const cycle = resolveCycle(data);
  const asOf = data.asOf ? new Date(`${data.asOf}T12:00:00`) : new Date();
  const week = cycleWeek(cycle, asOf);
  if (allTime) {
    return (
      <div className="cycle-chip alltime">
        <div className="cycle-dates">ALL-TIME</div>
        <div className="cycle-week">Career · not this cycle</div>
      </div>
    );
  }
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
        <div className="amount">{formatPoints(north.points)}</div>
      </div>
      <div className="vs">VS</div>
      <div className="score south">
        <div>
          <div className="campus">South Austin Campus</div>
          <div className="program-leads" style={{ justifyContent: "flex-end", marginTop: 2 }}>
            S:{formatMoney(south.service)} · R:{formatMoney(south.retail)}
          </div>
        </div>
        <div className="amount">{formatPoints(south.points)}</div>
      </div>
    </div>
  );
}

function Board({
  campus,
  institute,
  allTime,
  onPageCycle,
}: {
  campus?: Campus;
  institute?: boolean;
  allTime?: boolean;
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
    () => rankAllPrograms(students, allTime ? undefined : campus, allTime ? "career" : "cycle"),
    [students, campus, allTime],
  );
  const maxPages = Math.max(
    1,
    ...PROGRAMS.map((program) => listPageWindow(boards[program].length, pageSize, 0).pageCount),
  );
  const title = allTime
    ? "ALL-TIME"
    : institute
      ? "All Institute"
      : campus
        ? CAMPUS_LABELS[campus]
        : "High Five";
  const subtitle = allTime
    ? "Career points in school history · both campuses · not the July 20 – August 28 cycle"
    : institute
      ? "North Austin Campus vs South Austin Campus · High Five is top 5 this cycle in each program"
      : "Private High Five Competition · this cycle · ranked by points within program only";

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
        <CycleChip allTime={allTime} />
      </header>
      {institute && !allTime ? <InstituteScoreboard /> : null}
      <div className="tv-columns">
        {PROGRAMS.map((program) => (
          <ProgramColumn
            key={program}
            program={program}
            rows={boards[program]}
            showCampus={institute || allTime}
            listPage={listPage}
            onFit={program === PROGRAMS[0] ? reportFit : undefined}
            allTime={allTime}
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
  const [showAllTime, setShowAllTime] = useState(false);

  const advanceSlide = useCallback(() => {
    if (slides.length < 2) return;
    setIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (showAllTime) return;
    const timer = window.setTimeout(() => setShowAllTime(true), ALL_TIME_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [showAllTime]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        if (showAllTime) {
          setShowAllTime(false);
          setIndex((current) => (current + 1) % slides.length);
          return;
        }
        setIndex((current) => (current + 1) % slides.length);
      }
      if (event.key === "ArrowLeft") {
        if (showAllTime) {
          setShowAllTime(false);
          return;
        }
        setIndex((current) => (current - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, showAllTime]);

  const slide = slides[index];

  return (
    <main className={`tv-shell ${showAllTime ? "all-time" : ""}`}>
      {showAllTime ? (
        <Board
          key="alltime"
          allTime
          institute
          onPageCycle={() => setShowAllTime(false)}
        />
      ) : (
        <Board
          key={slide.key}
          campus={slide.campus}
          institute={slide.institute}
          onPageCycle={mode === "slideshow" ? advanceSlide : undefined}
        />
      )}
      {mode === "slideshow" ? (
        <div className="tv-dots" aria-hidden>
          {slides.map((item, slideIndex) => (
            <span key={item.key} className={`dot ${!showAllTime && slideIndex === index ? "on" : ""}`} />
          ))}
          <span className={`dot alltime ${showAllTime ? "on" : ""}`} />
        </div>
      ) : null}
      <SponsorTicker />
    </main>
  );
}
