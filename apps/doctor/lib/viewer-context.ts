"use client";

import { createViewerContext } from "@clinic/web-kit/viewer-context";
import type { Viewer } from "./viewer.graphql";

// サーバーの部品（レイアウト）で確かめた、ログインしている人を、下の部品に配る
export const { ViewerProvider, useViewer } = createViewerContext<Viewer>();
