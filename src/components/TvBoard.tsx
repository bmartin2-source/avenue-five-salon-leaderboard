"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CAMPUS_LABELS,
  CAMPUS_SHORT,
  PROGRAM_LABELS,
  campusTotals,
  displayCycleWeek,
  formatCycleRange,
  formatMoney,
  formatPoints,
  isQuietHours,
  listPageWindow,
  ranksFrozenFor,
  rankTvPrograms,
  TV_STAGE_HEIGHT,
  TV_STAGE_WIDTH,
  tvRowHeight,
  tvStageScale,
  type Campus,
  type Program,
  type Cycle,
  type RankedStudent,
  type StudentRecord,
} from "@/lib/leaderboard";
import { useLiveBoard } from "@/lib/live-board";
import type { AdminStore, TickerItem } from "@/lib/admin-store";

export type TvMode = "slideshow" | "north" | "south";

function RankArrow({ delta }: { delta: number }) {
  if (delta > 0) return <span className="rank-arrow up">▲{delta}</span>;
  if (delta < 0) return <span className="rank-arrow down">▼{Math.abs(delta)}</span>;
  return null;
}

function RankRow({
  student,
  index,
  showCampus,
  rowHeight,
  allTime,
}: {
  student: RankedStudent;
  index: number;
  showCampus?: boolean;
  rowHeight: number;
  allTime?: boolean;
}) {
  const y = index * rowHeight;
  const moved = !allTime && student.rankDelta > 0 ? "moved-up" : !allTime && student.rankDelta < 0 ? "moved-down" : "";
  const marked = allTime ? student.allTime : student.highFive;
  const leadClass = student.rank === 1
    ? allTime ? "all-time-lead" : "high-five-lead"
    : marked
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
          {marked ? (
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
  rowHeight,
}: {
  program: Program;
  rows: RankedStudent[];
  showCampus?: boolean;
  listPage: number;
  onFit?: (count: number) => void;
  allTime?: boolean;
  rowHeight: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ count: 15, height: 780 });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const height = el.clientHeight;
      const count = Math.max(1, Math.floor(height / rowHeight));
      setFit({ count, height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rowHeight]);

  useEffect(() => {
    onFit?.(fit.count);
  }, [fit.count, onFit]);

  const pageWindow = listPageWindow(rows.length, fit.count, listPage);
  const visible = rows.slice(pageWindow.start, pageWindow.end);
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
        <div className="track-shift" key={`${pageWindow.page}-${fit.count}`}>
          {visible.map((student, index) => (
            <RankRow
              key={student.id}
              student={student}
              index={index}
              showCampus={showCampus}
              rowHeight={rowHeight}
              allTime={allTime}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorTicker({ items, enabled }: { items: TickerItem[]; enabled: boolean }) {
  if (!enabled || items.length === 0) {
    return <div className="ticker" aria-hidden />;
  }
  const loop = [...items, ...items];
  return (
    <div className="ticker" aria-label="Sponsor ticker">
      <div className="ticker-track">
        {loop.map((sponsor, index) => (
          <div className="ticker-item" key={`${sponsor.id}-${index}`}>
            <strong>{sponsor.name}</strong>
            <span>{sponsor.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CycleChip({
  allTime,
  cycle,
}: {
  allTime?: boolean;
  cycle: Cycle;
}) {
  const week = displayCycleWeek(cycle);
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

function InstituteScoreboard({ students }: { students: StudentRecord[] }) {
  const north = campusTotals(students, "north");
  const south = campusTotals(students, "south");
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

function SafeScreen({ reason }: { reason: "hidden" | "quiet" | "hold" }) {
  return (
    <div className="tv-safe">
      <div className="mark">A5</div>
      <p className="safe-kicker">Avenue Five Institute</p>
      <h1>High Five Competition</h1>
      <p className="safe-note">
        {reason === "hidden"
          ? "Board hidden · staff safe screen"
          : reason === "quiet"
            ? "Quiet hours · branding hold"
            : "Private"}
      </p>
    </div>
  );
}

function Board({
  campus,
  institute,
  allTime,
  onPageCycle,
  students,
  cycle,
  programs,
  store,
  holdMotion,
}: {
  campus?: Campus;
  institute?: boolean;
  allTime?: boolean;
  onPageCycle?: () => void;
  students: StudentRecord[];
  cycle: Cycle;
  programs: readonly Program[];
  store: AdminStore;
  holdMotion?: boolean;
}) {
  const [listPage, setListPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const reportFit = useCallback((count: number) => {
    setPageSize((current) => (current === count ? current : count));
  }, []);

  const rowHeight = tvRowHeight(store.typeStep);
  const frozen = ranksFrozenFor(store.frozenScopes, campus, allTime);
  const boards = useMemo(
    () =>
      rankTvPrograms(students, {
        campus,
        institute,
        allTime,
        highFiveSize: store.highFiveCutoff,
        frozenScopes: store.frozenScopes,
        frozenRanks: store.frozenRanks,
        hiddenStudentIds: store.hiddenStudentIds,
      }),
    [students, campus, institute, allTime, store.highFiveCutoff, store.frozenScopes, store.frozenRanks, store.hiddenStudentIds],
  );
  const maxPages = Math.max(
    1,
    ...programs.map((program) => listPageWindow(boards[program].length, pageSize, 0).pageCount),
  );
  const title = allTime
    ? "ALL-TIME"
    : institute
      ? "All Institute"
      : campus
        ? CAMPUS_LABELS[campus]
        : "High Five";
  const subtitle = allTime
    ? `Career points in school history · both campuses · not the ${formatCycleRange(cycle)} cycle`
    : institute
      ? `North Austin Campus vs South Austin Campus · High Five is top ${store.highFiveCutoff} this cycle in each program`
      : "Private High Five Competition · this cycle · ranked by points within program only";

  useEffect(() => {
    if (store.paused || holdMotion) return;
    const timer = window.setInterval(() => {
      setListPage((current) => current + 1);
    }, store.pageHoldSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [store.paused, holdMotion, store.pageHoldSeconds]);

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
      <div className="tv-top">
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
          <CycleChip allTime={allTime} cycle={cycle} />
        </header>
        {frozen ? (
          <div className="tv-frozen" role="status">
            RANKS FROZEN · awards walk-on
          </div>
        ) : null}
        {institute && !allTime ? <InstituteScoreboard students={students} /> : null}
      </div>
      <div className="tv-columns">
        {programs.map((program) => (
          <ProgramColumn
            key={program}
            program={program}
            rows={boards[program]}
            showCampus={institute || allTime}
            listPage={listPage}
            onFit={program === programs[0] ? reportFit : undefined}
            allTime={allTime}
            rowHeight={rowHeight}
          />
        ))}
      </div>
    </>
  );
}

function useTvStageScale() {
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("tv-lock");
    const update = () => {
      setScale(tvStageScale(window.innerWidth, window.innerHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      document.documentElement.classList.remove("tv-lock");
    };
  }, []);

  return scale;
}

function TvStage({
  scale,
  typeStep = 0,
  quiet,
  frozen,
  allTime,
  children,
}: {
  scale: number | null;
  typeStep?: number;
  quiet?: boolean;
  frozen?: boolean;
  allTime?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="tv-frame">
      <div
        className="tv-stage"
        style={{
          width: TV_STAGE_WIDTH,
          height: TV_STAGE_HEIGHT,
          ...(scale != null
            ? { transform: `translate(-50%, -50%) scale(${scale})` }
            : {}),
        }}
      >
        <main
          className={`tv-shell ${allTime ? "all-time" : ""}`}
          data-type={String(typeStep)}
          data-quiet={quiet ? "1" : "0"}
          data-frozen={frozen ? "1" : "0"}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function TvBoard({ mode }: { mode: TvMode }) {
  const live = useLiveBoard();
  const scale = useTvStageScale();
  const store = live.store;
  const [now, setNow] = useState(() => new Date("2026-08-21T12:00:00"));
  const [index, setIndex] = useState(0);
  const [showAllTime, setShowAllTime] = useState(false);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const quiet = isQuietHours(now, store.quietStart, store.quietEnd, store.quietHoursEnabled);
  const holdMotion = store.paused || quiet;
  const safeReason = store.boardHidden ? "hidden" : quiet && store.quietDisplay === "branding" ? "quiet" : null;
  const pinned = mode === "slideshow" && store.forceSlide === "auto" && store.kioskPin !== "institute";

  const slides = useMemo(() => {
    if (mode !== "slideshow") return [{ key: mode, campus: mode as Campus }];
    if (store.forceSlide === "auto" && store.kioskPin !== "institute") {
      return [{ key: store.kioskPin, campus: store.kioskPin }];
    }
    const campusSlides = live.campuses.map((campus) => ({ key: campus, campus }));
    return [...campusSlides, { key: "institute" as const, institute: true }];
  }, [mode, live.campuses, store.forceSlide, store.kioskPin]);

  const forced = store.forceSlide;
  const canRotate = forced === "auto" && !holdMotion && !safeReason && !pinned;
  const canReturnFromAllTime = forced === "auto" && !holdMotion && !safeReason;

  const advanceSlide = useCallback(() => {
    if (!canRotate || slides.length < 2) return;
    setIndex((current) => (current + 1) % slides.length);
  }, [slides.length, canRotate]);

  useEffect(() => {
    if (mode !== "slideshow") return;
    if (forced === "allTime") {
      setShowAllTime(true);
      return;
    }
    if (forced !== "auto") {
      setShowAllTime(false);
      const next = slides.findIndex((slide) => slide.key === forced);
      if (next >= 0) setIndex(next);
    }
  }, [forced, mode, slides]);

  useEffect(() => {
    if (showAllTime || holdMotion || safeReason || forced !== "auto" || mode !== "slideshow") return;
    const timer = window.setTimeout(
      () => setShowAllTime(true),
      store.allTimeAfterSeconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [showAllTime, holdMotion, safeReason, store.allTimeAfterSeconds, forced, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (forced !== "auto" || holdMotion || safeReason) return;
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
  }, [slides.length, showAllTime, forced, holdMotion, safeReason]);

  if (!live.ready) {
    return (
      <TvStage scale={scale}>
        <SafeScreen reason="hold" />
      </TvStage>
    );
  }

  const slide = slides[index] ?? slides[0];
  const boardProps = {
    students: live.students,
    cycle: live.cycle,
    programs: live.programs,
    store,
    holdMotion,
  };
  const showSlideshowDots = mode === "slideshow" && !pinned && !safeReason;

  return (
    <TvStage
      scale={scale}
      typeStep={store.typeStep}
      quiet={quiet}
      frozen={store.frozenScopes.length > 0}
      allTime={showAllTime}
    >
      {safeReason ? (
        <SafeScreen reason={safeReason} />
      ) : showAllTime ? (
        <Board
          key="alltime"
          allTime
          institute
          onPageCycle={canReturnFromAllTime ? () => setShowAllTime(false) : undefined}
          {...boardProps}
        />
      ) : (
        <Board
          key={slide.key}
          campus={"campus" in slide ? slide.campus : undefined}
          institute={"institute" in slide ? slide.institute : undefined}
          onPageCycle={canRotate ? advanceSlide : undefined}
          {...boardProps}
        />
      )}
      {showSlideshowDots ? (
        <div className="tv-dots" aria-hidden>
          {slides.map((item, slideIndex) => (
            <span key={item.key} className={`dot ${!showAllTime && slideIndex === index ? "on" : ""}`} />
          ))}
          <span className={`dot alltime ${showAllTime ? "on" : ""}`} />
        </div>
      ) : null}
      {safeReason ? null : <SponsorTicker items={live.sponsors} enabled={store.tickerEnabled} />}
    </TvStage>
  );
}
