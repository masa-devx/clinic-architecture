"use client";

import { createContext, useContext, type ReactNode } from "react";

// サーバーの部品（レイアウト）で確かめた、ログインしている人を、下の部品に配る仕組みを作る。
// ログインしている人の形は、アプリごとに違う（スキーマから作った型）ので、型を受け取って作る
export function createViewerContext<Viewer>() {
  const Context = createContext<Viewer | null>(null);

  function ViewerProvider({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
    return <Context.Provider value={viewer}>{children}</Context.Provider>;
  }

  function useViewer(): Viewer {
    const viewer = useContext(Context);
    if (!viewer) throw new Error("useViewer は、ViewerProvider の中で使ってください");
    return viewer;
  }

  return { ViewerProvider, useViewer };
}
