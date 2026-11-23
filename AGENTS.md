# clinic-architecture

学習用。架空のオンライン診療（予約 → 受付 → 診察 → 会計）を、Rails＋GraphQL＋PostgreSQL と Next.js＋Chakra UI＋Apollo Client で作り、バックエンドとフロントエンドの設計を「なぜ入れるのか」から理解する。

AI（Claude Code・Codex）が最初に読む地図。`CLAUDE.md` はこのファイルへのリンク。何が分からないか・何を確かめるか・守ることは [docs/product.md](docs/product.md) を正とし、ここには書き写さない。

## 最初に知っておくこと（この題材だけの決まり）

- **最初から、きちんとした設計で作る**（2026-11-17 に変更。[docs/decisions.md](docs/decisions.md) の D-002）。素朴な形を先に作って困らせる順番は取らない。二重予約を防ぐ制約・N+1 の対策・インデックス・カーソル・認可・層の分割・エラーの設計は、その機能を作るときに、ルール（[architecture.md](agents/rules/architecture.md)・[database.md](agents/rules/database.md)）のとおりに入れる
- **段階1までは、解説で止まらずに作る**。[explain-step](agents/skills/explain-step/SKILL.md) の解説と [explain-change](agents/skills/explain-change/SKILL.md) の記録は、動いたあとにまとめて作る。段階2より先の進め方は、段階1が終わってから決める
- **`template` ブランチが土台**。実践の課題は、`template` から `practice/<記号>-<名前>` のブランチを切って進める（[docs/practice.md](docs/practice.md)）。`template` には、直接コミットしない
- **今どの段階か**は [docs/steps/README.md](docs/steps/README.md) の目次で確かめる

## 技術スタック

版は、入れたとき（2026-11-17）の安定版。Node と pnpm は `mise.toml`、Ruby は `docker/api/Dockerfile`、PostgreSQL は `compose.yaml`、ライブラリはロックファイル（`apps/api/Gemfile.lock`・`pnpm-lock.yaml`）を正とする。選んだ理由と比べたものは [docs/roadmap.md](docs/roadmap.md) の 2章と [docs/decisions.md](docs/decisions.md)。

| 種類 | 使うもの | 版 | 選んだ理由（短く） |
| --- | --- | --- | --- |
| バックエンド | Ruby・Ruby on Rails（API モード）・graphql-ruby | Ruby 4.0.9・Rails 8.1.4.1・graphql 2.6 | 手本にする構成と同じ。一から組んで理解する |
| DB | PostgreSQL | 18.7 | 実行計画・ロックの道具がそろっている |
| フロントエンド | TypeScript・Next.js（App Router）・Chakra UI・Apollo Client・GraphQL Code Generator | TypeScript 6.0（typescript-eslint が 7 にまだ対応していないため）・Next.js 16.4・React 19.3・Chakra UI 3.38・Apollo Client 4.3・codegen 8（client-preset 7） | 手本と同じ道具の、今の形 |
| パッケージ管理 | pnpm（workspace） | Node 26.13.1・pnpm 12.21.0 | 1つのリポジトリで、スキーマと画面を一緒に変える |
| テスト | RSpec＋FactoryBot＋Bullet／Vitest＋Testing Library＋MSW・Playwright | rspec-rails 8.1・Vitest 5.1・MSW 3.0・Playwright 1.65 | [docs/frontend.md](docs/frontend.md) のテストの層 |
| 静的検査・整形 | RuboCop／ESLint・Prettier | rubocop-rails-omakase／ESLint 9.39（eslint-config-next の中のプラグインが 10 にまだ対応していないため）・Prettier 3.10 | — |
| 手元の環境 | Docker Compose | — | コマンド1つで立ち上がる |
| ジョブ・メール | Solid Queue・Action Mailer・Mailpit（手元の受信箱） | solid_queue 1.7・Mailpit 1.33 | DB にジョブを置く。Redis が要らない |
| あとから入れるもの | Stripe（テストモード）・strong_migrations・Packwerk・Sentry・Storybook＋Chromatic・Renovate | — | その機能を作る段階で入れる（Bullet と Dataloader は、段階1で入れた） |
| デプロイ先 | AWS ECS（Fargate）・RDS・Terraform（段階7。短い期間だけ） | — | 手本と同じ形を一度通す |

## ディレクトリ構成

| パス | 責務 |
| --- | --- |
| apps/api/ | Rails（API モード）。下の表のとおりに分ける |
| apps/api/app/graphql/ | 入口。利用者ごとに3つ（`patient_api/`・`clerk_api/`・`doctor_api/`。その人が使う query と mutation だけを載せる）。`types/`（型）・`resolvers/`（読む）・`mutations/`（変える）・`sources/`（Dataloader のまとめ読み）は、3つで共有する。業務のルールは書かない |
| apps/api/app/services/<機能>/ | 業務の処理。1つの操作 = 1クラス（`Appointments::Book` など）。DB も時計も読まない決まり（`CancellationRule`・`Slots::Schedule`）も、ここに置く |
| apps/api/app/queries/<機能>/ | 複雑な読み取り（一覧・空き枠）。SQL を1か所で見られるようにする |
| apps/api/app/policies/ | 認可。要件の4章の表を、ここだけに書く |
| apps/api/app/models/ | ActiveRecord。関連・検証・値の一覧だけ |
| apps/api/app/jobs/・config/recurring.yml | 定期に動かすジョブ（通知を送る・リマインドを入れる・無断キャンセルにする）。中身は services を呼ぶだけ |
| apps/api/app/mailers/・app/views/ | 患者へのメール |
| apps/api/lib/ | どの機能にも属さない基盤（エラーのコード・結果の型・ログ・カーソルのページング） |
| apps/api/schema/ | Rails が書き出した、3つの入口のスキーマ（`patient.graphql`・`clerk.graphql`・`doctor.graphql`）。画面の型は、ここから作る |
| apps/patient/・apps/clerk/・apps/doctor/ | 画面（Next.js）。患者用・事務スタッフ用・医師用の3つ。どれも `app/`（URL と画面・ログインの確認）→ `features/<機能>/`（部品・fragment・mutation・テスト）→ `lib/`（ログインしている人・生成した型 `lib/gql/`）。向きは ESLint で止めている（`eslint.app.mjs`） |
| packages/ui/ | 見た目の部品とテーマ（Chakra UI）。画面の枠・状態の印・確認の窓つきボタンなど。業務の言葉を持たない |
| packages/web-kit/ | 3つの画面で共有する土台。Apollo の設定・ログインのフォーム・画面の枠と Next.js のつなぎ・日付・状態の呼び方。`staff/` は、事務スタッフと医師で共通の部品（診療枠を作るフォーム・空き枠の一覧） |
| e2e/ | Playwright の E2E。3つの画面をまたいで、初期データ（`apps/api/db/seeds.rb`）に対して走らせる |
| docker/api/ | 手元の開発とテストで使う Rails のイメージ |
| docs/ | 目的（product.md）・要件（requirements.md）・選定と段階（roadmap.md）・フロントの設計（frontend.md）・設計の記録（decisions.md）・課題と改善（improvements/）・段階ごとの解説（steps/） |
| agents/ | 開発ルール（rules/）・手順（skills/） |
| .claude/ | Claude Code 向けの権限・フック・レビュー役。rules・skills は agents/ へのリンク |
| .agents/ | Codex 向け。skills は agents/skills へのリンク |
| apps/*/AGENTS.md | Next.js が `pnpm dev` のときに自動で作る注意書き（Next.js 16 は、同梱の `node_modules/next/dist/docs/` を読むこと） |

## 主要コマンド

動くと確かめたコマンドだけを書く（2026-11-18 に、手元で確かめた）。実行場所は、どれもリポジトリのルート。

| 操作 | コマンド | 前提条件 | 使わないもの（理由） |
| --- | --- | --- | --- |
| 道具の版をそろえる | `mise install` | mise | nodenv・nvm・Volta・rbenv（mise に一本化したため） |
| セットアップ | `pnpm install` → `docker compose up -d --wait`（初回は gem を入れ、DB を作り、初期データを入れる） | Docker | 手元の Ruby（Ruby は Docker の中だけで動かす） |
| 起動 | `docker compose up -d --wait`（API は http://localhost:3001 ・DB は 55440 番・メールの受信箱は http://localhost:58026 ・ジョブの係も一緒に起動する）→ `pnpm dev`（3つの画面を一緒に起動する。患者用は http://localhost:3000 ・事務スタッフ用は http://localhost:3010 ・医師用は http://localhost:3020 ） | セットアップ | `bin/rails server` を手元で直接（同上） |
| 止める | `docker compose stop`（`down -v` は DB の中身も消す） | — | — |
| テスト（バックエンド） | `docker compose run --rm api bundle exec rspec` | DB が起動している | — |
| テスト（フロントエンド） | `pnpm test`（Vitest）／`pnpm e2e`（Playwright。API と DB を起動し、初期データを入れ直してから走る。初回は `pnpm --filter e2e exec playwright install chromium`） | Docker | — |
| 静的検査 | `docker compose run --rm api bin/rubocop`／`pnpm lint`・`pnpm typecheck`・`pnpm format:check` | — | `next lint`（Next.js 16 でなくなった） |
| スキーマから型を作る | `docker compose run --rm api bin/rails graphql:dump` → `pnpm codegen` | スキーマ（型・resolver・mutation）を変えたとき | 型を手で書く |
| マイグレーション | `docker compose run --rm api bin/rails db:migrate` | — | — |
| 初期データを入れ直す | `docker compose run --rm api bin/rails db:seed`（何度流しても同じ結果） | — | — |
| 計測用の大量のデータ（課題 E-1） | `docker compose exec api bin/rails bulk:load`（予約100万件・1分半ほど。`APPOINTMENTS=10000` で小さく）／`bin/rails bulk:clear` で消す。初期データとは別の「計測用クリニック」に入る | — | — |
| ビルド | `pnpm build` | — | — |
| 大量のデータを入れる（段階2） | 【記入】 | 【記入】 | 【記入】 |

初期データのログイン（手元だけの捨ててよい値。パスワードは全員 `password-for-local-only`。正は `apps/api/db/seeds.rb`）: 患者は `patient1@example.com`（http://localhost:3000 ）、事務スタッフは `clerk1@sakura.example`（管理者なので、監査ログも見られる。http://localhost:3010 ）、医師は `doctor1@sakura.example`（http://localhost:3020 ）。3つの画面は、ログインが別々。

未記入のコマンドは推測して実行しない。必要な操作について確認する。

よく使う確認のコマンド（テスト・静的検査）が決まったら、`.claude/settings.json` の `permissions.allow` に足す。足すのは、何度実行しても何も壊さないコマンドだけにする。

## 開発ルールの適用

### 作業前に読むルール

[agents/README.md](agents/README.md) で対象に合うルールを選ぶ。複数該当したらすべて読む。

| 作業 | 読むルール |
| --- | --- |
| 実装・設計の変更 | [architecture.md](agents/rules/architecture.md) |
| 振る舞いの変更・テストの追加 | [testing.md](agents/rules/testing.md) |
| 構造化ログの実装・変更 | [logging.md](agents/rules/logging.md) |
| DB・マイグレーションの作成・変更 | [database.md](agents/rules/database.md) |

ルールの【記入】（対象のパス・使う道具）は、まだ埋めていない（[harness-setup](agents/skills/harness-setup/SKILL.md) で埋める）。矛盾する指示や未確定の仕様は、該当箇所を示して確認する。

### 作業の流れ

実践の課題（[docs/practice.md](docs/practice.md)）は、架空の会社（[docs/company.md](docs/company.md)）の現場を想定して、役を分けて進める。**何を・なぜ・どの順で**は PdM の [pdm](agents/skills/pdm/SKILL.md)、**どう作るか・どこまでで終わりか**はプロジェクトリーダーの [tech-lead](agents/skills/tech-lead/SKILL.md)。どちらも、相手が考える前に答えを出さない。終えた課題は、面接で語る形で [docs/stories/](docs/stories/README.md) に残す。

1. 段階1までは、解説で止まらずに実装する（[docs/decisions.md](docs/decisions.md) の D-002）。段階2より先の進め方は、段階1が終わってから決める
2. 確かめたいことは、テストで書く。守りを外すとテストが落ちることを確かめる（例: UNIQUE を外すと、同時に20件の予約が20件とも成功する）
3. 実装が終わったら、[explain-change](agents/skills/explain-change/SKILL.md) で解説し、[docs/decisions.md](docs/decisions.md) と [docs/improvements/](docs/improvements/README.md) に記録する
4. 区切りごとに、[review](agents/skills/review/SKILL.md) の手順で見直す（実装の会話を持たないサブエージェントに、差分と確かめたいことを渡す）
5. コミット・push は、頼まれたときだけ行う

### 依頼の範囲

- 頼まれた範囲だけを変更する。気づいた改善や別の不具合は手を付けず、報告に挙げる
- 取り消せる細かな判断は妥当な仮定を置いて進め、仕様・データに関わる判断は確認する
- 返事がないことを承認とみなさない
- 実務のコード・プロダクト名・社名・お客さまのデータを持ち込まない。仕組みだけを、自分で作った例で再現する
- 秘密の値のファイル（`.env` など）を読まない。値をログ・エラー・テストの出力に出さない。見本の `.env.example` は読んでよい

### 応答と報告

- 結論から端的に答える。前置き・繰り返し・求められていない補足を省き、できるだけ短い文章で返す。判断に必要な根拠と未確認の事項は省かない。返事は日本語で書く
- 変更内容、実行した検証と結果、未検証の範囲を報告する。実行していないテストを通過扱いにしない
- 数字は、測ったものだけを書く。測った条件（データの件数・同時の数・手元の環境）を添える
