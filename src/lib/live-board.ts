"use client";

import { useEffect, useState } from "react";
import { data } from "./data";
import {
  ADMIN_EVENT,
  adminCycle,
  composeStudents,
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
};

export function loadLiveBoard(): LiveBoard {
  const store = readAdminStore(data);
  return {
    store,
    students: composeStudents(data.students, store, readConsentOverrides()),
    cycle: adminCycle(store),
    sponsors: liveSponsors(store),
    programs: visiblePrograms(store),
    campuses: visibleCampuses(store),
  };
}

export function useLiveBoard(): LiveBoard {
  const [live, setLive] = useState<LiveBoard>(() => ({
    store: readAdminStore(data),
    students: composeStudents(data.students, readAdminStore(data), {}),
    cycle: adminCycle(readAdminStore(data)),
    sponsors: liveSponsors(readAdminStore(data)),
    programs: visiblePrograms(readAdminStore(data)),
    campuses: visibleCampuses(readAdminStore(data)),
  }));

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
