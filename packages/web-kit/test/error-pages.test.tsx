// @vitest-environment jsdom
// 画面を描くので、このファイルだけブラウザの代わり（jsdom）で走らせる
import { UiProvider } from "@clinic/ui/provider";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorPage, NotFoundPage } from "../src/error-pages";

// テストする所: エラーの画面

// サーバーで起きたエラー。中身（接続先など）は画面に出さず、問い合わせの番号（digest）だけを出す
const serverError = Object.assign(new Error("PG::ConnectionBad: could not connect to db:5432"), {
  digest: "1234567890",
});

function renderPage(ui: ReactElement) {
  return render(<UiProvider>{ui}</UiProvider>);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("正常系", () => {
  it("ページが見つからないときは、最初の画面へ戻る道を出す", () => {
    renderPage(<NotFoundPage homeHref="/appointments" />);

    expect(screen.getByRole("heading", { name: "ページが見つかりません" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "最初の画面へ戻る" })).toHaveAttribute("href", "/appointments");
  });

  it("エラーの中身は見せず、問い合わせの番号と、やり直す道を出す", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    renderPage(<ErrorPage error={serverError} reset={reset} />);

    expect(screen.getByRole("heading", { name: "画面を表示できませんでした" })).toBeInTheDocument();
    // サーバーの内部の情報（接続先など）は、画面に出さない
    expect(screen.queryByText(/PG::ConnectionBad/)).not.toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});

describe("異常系", () => {
  it("問い合わせの番号がなければ、番号の行を出さない", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderPage(<ErrorPage error={new Error("x")} reset={() => {}} />);

    expect(screen.queryByText(/問い合わせのときは/)).not.toBeInTheDocument();
  });
});
