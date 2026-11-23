// @vitest-environment jsdom
// フックを描くので、このファイルだけブラウザの代わり（jsdom）で走らせる
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTodayInTokyo } from "../src/use-today";

// テストする所: 日本時間の今日を返すフック（useTodayInTokyo）

// 日本時間で 1/7 の 23:59:30
const justBeforeMidnight = new Date("2030-01-07T14:59:30Z");

afterEach(() => {
  vi.useRealTimers();
});

describe("正常系", () => {
  it("日本時間の今日を返し、0 時をまたいだら次の日に変わる", () => {
    vi.useFakeTimers();
    vi.setSystemTime(justBeforeMidnight);
    const { result } = renderHook(() => useTodayInTokyo());
    expect(result.current).toBe("2030-01-07");

    act(() => vi.advanceTimersByTime(29_000));
    expect(result.current).toBe("2030-01-07");
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe("2030-01-08");
    // 次の日も、また 0 時に変わる
    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1_000));
    expect(result.current).toBe("2030-01-09");
  });
});

describe("異常系", () => {
  it("パソコンが眠っていて、タイマーが遅れて起きても、起きたときの日付になる", () => {
    vi.useFakeTimers();
    vi.setSystemTime(justBeforeMidnight);
    const { result } = renderHook(() => useTodayInTokyo());

    // 時計だけが2日進み、タイマーはそのあとで起きる
    vi.setSystemTime(new Date("2030-01-09T03:00:00Z"));
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current).toBe("2030-01-09");
  });
});
