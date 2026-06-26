"use client";

import { useEffect, useState } from "react";
import { todayIso } from "./dates";

/** Current local date (YYYY-MM-DD), re-synced at midnight and when the tab refocuses. */
export function useTodayIso(): string {
  const [today, setToday] = useState(todayIso);

  useEffect(() => {
    function refresh() {
      setToday(todayIso());
    }

    function scheduleMidnightRefresh() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(now.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      return window.setTimeout(() => {
        refresh();
        timer = scheduleMidnightRefresh();
      }, midnight.getTime() - now.getTime());
    }

    let timer = scheduleMidnightRefresh();

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return today;
}
