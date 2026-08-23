"use client";

import { useEffect, useState } from "react";
import { data } from "./data";
import {
  ADMIN_EVENT,
  adminCycle,
  composeStudents,
  defaultAdminStore,
  liveSponsors,
  readAdminStore,
  visibleCampuses,
  visiblePrograms,
  type AdminStore,
} from "./admin-store";
import { readConsentOverrides } from "./session";
import type { Cycle, StudentRecord } from "./leaderboard";

export type LiveBoard = {
  store: AdminStore;
  students: StudentRecord[];
  cycle: Cycle;
  sponsors: AdminStore["sponsors"];
  programs: ReturnType<typeof visiblePrograms>;
  campuses: ReturnType<typeof visibleCampuses>;
  ready: boolean;
};

function boardFromStore(store: AdminStore, consent: Record<string, boolean> = {}): Omit<LiveBoard, "ready"> {
  return {
    store,
    students: composeStudents(data.students, store, consent),
    cycle: adminCycle(store),
    sponsors: liveSponsors(store),
    programs: visiblePrograms(store),
    campuses: visibleCampuses(store),
  };
}

/** Same on the server and the first client paint — never reads localStorage. */
export function seedLiveBoard(): LiveBoard {
  return { ...boardFromStore(defaultAdminStore(data)), ready: false };
}

export function loadLiveBoard(): LiveBoard {
  return { ...boardFromStore(readAdminStore(data), readConsentOverrides()), ready: true };
}

export function useLiveBoard(): LiveBoard {
  const [live, setLive] = useState<LiveBoard>(seedLiveBoard);

  useEffect(() => {
    const refresh = () => setLive(loadLiveBoard());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return live;
}
