"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Viewer } from "./viewer.graphql";

const ViewerContext = createContext<Viewer | null>(null);

// サーバーの部品（レイアウト）で確かめた、ログインしている人を、下の部品に配る
export function ViewerProvider({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export function useViewer(): Viewer {
  const viewer = useContext(ViewerContext);
  if (!viewer) throw new Error("useViewer は、ViewerProvider の中で使ってください");
  return viewer;
}
