"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

// Chakra UI のスタイル（Emotion）を、サーバーで描いた HTML に正しく入れる。
// 何もしないと、Emotion は <style> を部品のすぐ前に入れる。App Router は HTML を少しずつ送るので、
// ブラウザ側の描画（<style> を挟まない）と食い違い、「Hydration failed」になる。
// そこで、サーバーで出たスタイルをためておき、Next.js が HTML を送るたびに、まとめて <style> として流す
export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "css" });
    // 部品のすぐ前に <style> を入れる動きをやめさせる
    cache.compat = true;

    // 前に流したあとに増えたスタイルの名前を、ためておく
    const insert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) inserted.push(serialized.name);
      return insert(...args);
    };
    const flush = () => {
      const names = inserted;
      inserted = [];
      return names;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    const styles = names.map((name) => cache.inserted[name]).join("");
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
