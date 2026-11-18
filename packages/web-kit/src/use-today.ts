"use client";

import { useEffect, useState } from "react";
import { addDays, toDateInTokyo } from "./datetime";

// 日本時間の「今日」（YYYY-MM-DD）。画面を開いたまま日付をまたいだら、新しい日に変わる
export function useTodayInTokyo(): string {
  const [today, setToday] = useState(() => toDateInTokyo(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // 今の日付を入れて、次の日の 0 時（日本時間。夏時間はないので +09:00 で決まる）に、また確かめる。
    // タイマーが早めに起きても、パソコンが眠っていて遅れても、起きたときの日付を入れ直すので、ずれたままにならない
    const check = () => {
      const now = toDateInTokyo(new Date());
      setToday(now);
      const nextMidnight = new Date(`${addDays(now, 1)}T00:00:00+09:00`).getTime();
      timer = setTimeout(check, Math.max(nextMidnight - Date.now(), 1_000));
    };
    check();
    return () => clearTimeout(timer);
  }, []);

  return today;
}
