# 文書の目次

| 文書 | 中身 |
| --- | --- |
| [product.md](product.md) | 目的・何を確かめるか・進め方・守ること（正） |
| [requirements.md](requirements.md) | 何を作るか（範囲・用語・権限・ユースケース・状態・機能・データとトランザクション・API・課題の一覧・未決） |
| [roadmap.md](roadmap.md) | 技術の選定・アーキテクチャ・最初から入れるものとあとから入れるもの・段階・1つの段階の回し方 |
| [frontend.md](frontend.md) | フロントエンドの層と依存の向き・描く場所・状態の置き場・6つのテーマ・テストの層 |
| [decisions.md](decisions.md) | 設計の記録（困ったこと → 比べた案 → 選んだもの → 理由 → 弱点） |
| [improvements/](improvements/README.md) | 課題と改善の記録（1件1ファイル・前と後の数字） |
| [practice.md](practice.md) | 今ある土台（template ブランチ）の中身と、そこから切って進める実践の課題の一覧 |
| [steps/](steps/README.md) | 段階ごとの解説と、6つの問いへの自分の答え・実装の記録 |
| [company.md](company.md) | 練習の舞台にする架空の会社（事業・数字・関係者・最初の依頼）。すべて推測の値 |
| [stories/](stories/README.md) | 終えた課題を、面接で語る形にした記録（課題・比べた案・理由・結果・学び・想定問答） |

## 書き方

- 決まったことだけを書く。決まっていないことは「未決」と書き、[requirements.md](requirements.md) の 13章に集める
- 同じことを2か所に書かない。ほかの文書にあることは、リンクで示す
- 段階が進んで仕様や選定が変わったら、先に requirements.md・roadmap.md を直してから実装する
- 文書を足したら、この目次に1行足す
