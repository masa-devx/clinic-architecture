# 段階0〜1. 土台から、予約が画面から通るまで（実装の記録）

> 2026-11-18 に、入口と画面を、患者・事務スタッフ・医師の3つに分けた（[decisions.md](../decisions.md) の D-017）。このページのファイルの場所（`apps/web`・`ClinicSchema`）は、分ける前のもの。

2026-11-17〜18 に、解説で止まらずにまとめて作った（[decisions.md](../decisions.md) の D-002）。そのため、このページには「実装の前の解説」と「6つの問いへの自分の答え」がまだなく、[explain-change](../../agents/skills/explain-change/SKILL.md) の「実装の記録」だけがある。

できること: 患者がログインして、医療機関を選び、空いている枠を予約し、キャンセルする。医師と事務スタッフがログインして、診療枠をまとめて作り、予約の一覧を絞り込んで見る。

## 1. 変えたファイル

### 土台

| ファイル | 何をしているか |
| --- | --- |
| `compose.yaml`・`docker/api/Dockerfile` | 手元の DB（PostgreSQL）と API（Rails）。gem はボリュームに入れる |
| `mise.toml`・`package.json`・`pnpm-workspace.yaml` | Node と pnpm の版、workspace（`apps/web`・`packages/ui`） |
| `.github/workflows/ci.yml` | RuboCop・RSpec／型の生成のずれ・ESLint・型・Vitest・ビルド |

### バックエンド（`apps/api/`）

| ファイル | 何をしているか |
| --- | --- |
| `db/migrate/*` | 表と制約（D-003）。部分 UNIQUE・排他制約・CHECK・組の外部キー |
| `app/models/*` | 関連・検証・値の一覧（役割・状態）だけ |
| `app/policies/*` | 認可。誰が、どの予約を見られるか・キャンセルできるか、誰の枠を作れるか（D-006） |
| `app/services/appointments/book.rb`・`cancel.rb` | 予約する・キャンセルする。1つの操作 = 1クラス |
| `app/services/appointments/cancellation_rule.rb` | キャンセルできるかの決まり（状態・期限）。DB も時計も読まない |
| `app/services/slots/bulk_create.rb`・`schedule.rb` | 枠をまとめて作る。時刻の並びを作る所は、DB を読まない |
| `app/services/auth/*` | ログイン（`SignIn`）と、Cookie のセッションとの対応（`Session`） |
| `app/queries/*` | 予約の一覧・空いている枠の SQL |
| `app/graphql/*` | 入口。型・resolver・mutation・Dataloader のまとめ読み |
| `app/controllers/graphql_controller.rb` | HTTP の入口。Origin と JSON の確認、ログインしている人を決める |
| `lib/error_code.rb`・`user_error.rb`・`result.rb` | エラーのコードの一覧と、業務の処理の結果の型（D-007） |
| `lib/pagination/keyset_connection.rb` | カーソルのページング（D-008） |
| `lib/app_log.rb` | ログの共通の出口（1行の JSON） |
| `db/seeds.rb` | 手元と E2E で使う、決まった初期データ |

### フロントエンド（`apps/web/`・`packages/ui/`）

| ファイル | 何をしているか |
| --- | --- |
| `app/**/layout.tsx`・`page.tsx` | URL と画面の対応。レイアウトが、サーバーでログインを確かめる |
| `lib/apollo/client.ts`・`provider.tsx` | Apollo Client の設定。エラーを1か所で受ける。続きの読み込みのキャッシュのつなぎ方 |
| `lib/auth/*` | ログインしている人を、サーバーで聞く（`fetch-viewer.ts`）・下の部品へ配る（`viewer-context.tsx`） |
| `lib/emotion-registry.tsx` | Chakra UI のスタイルを、サーバーの HTML に正しく入れる |
| `lib/gql/*` | スキーマとクエリから自動で作った型（手で直さない） |
| `features/auth/*` | ログインのフォーム・上の帯（メニューとログアウト） |
| `features/booking/*` | 医療機関を選ぶ・空いている枠を選んで予約する |
| `features/appointments/*` | 予約の一覧（患者・スタッフ）・絞り込みと URL の変換・キャンセル |
| `features/slots/*` | 診療枠をまとめて作るフォーム |
| `packages/ui/src/*` | テーマ・ページの題・読み込み中／空／エラーの見せ方・トースト |

## 2. 流れ（患者が、空いている枠を予約する）

1. ブラウザ: `features/booking/SlotPicker.tsx` の `onBook` が、`BookAppointment` の mutation を送る。送り先は、画面と同じオリジンの `/graphql`
2. Next.js: `next.config.ts` の `rewrites` が、Rails（`http://localhost:3001/graphql`）へ中継する。Cookie も一緒に渡る
3. Rails: `GraphqlController#execute` が、Origin と JSON を確かめ、`Auth::Session#current_user` で Cookie からログインしている患者を決め、`ClinicSchema.execute` に渡す
4. `Mutations::BookAppointment`: `Authentication#ready?` がログインを確かめ、`Appointments::Book` を呼ぶ
5. `Appointments::Book#call`: 患者か（`SlotPolicy#book?`）→ 枠があるか → 時刻を過ぎていないか → `Appointment.create!`
6. PostgreSQL: 部分 UNIQUE（`index_appointments_on_slot_id_active`）が、同じ枠の2件目を断る。断られたら、`RecordNotUnique` を `SLOT_TAKEN` に変えて返す
7. 結果は `{ appointment, errors }`。`Types::AppointmentType.authorized?` が、返す予約を見られるかを、もう一度確かめる
8. ブラウザ: 成功なら、予約の一覧のキャッシュを捨てて、「自分の予約」へ移る。`SLOT_TAKEN` なら、文を出して、空き枠を取り直す

## 3. 読んでほしい所

1. `apps/api/app/services/appointments/book.rb` の `Appointment.create!` と `rescue ActiveRecord::RecordNotUnique`: 空いているかを**確かめずに**入れている。確かめる SQL を足しても、同時に来たときの結果は変わらない（守っているのは UNIQUE）
2. `apps/api/app/services/appointments/cancel.rb` の `Appointment.where(id: ..., status: "booked").update_all(...)`: 読んだあとに状態が変わっていても壊れないように、「今も予約済なら」を更新の条件に入れている
3. `apps/api/app/policies/appointment_policy.rb` の `self.scope`: 一覧も1件の取得も、ここから始める。`Appointment.find(id)` と書くと、ほかの医療機関の予約も返る
4. `apps/api/lib/pagination/keyset_connection.rb` の `page_relation`: `(starts_at, id) > (?, ?)` の行の比較。画面から来たカーソルの値は、SQL の文字列に埋めずに、プレースホルダーで渡している
5. `apps/web/lib/apollo/client.ts` の `errorLink`: `ErrorLink` は、返した値を「やり直した結果」として扱う。何かを返すと壊れる（部品のテストが見つけた）

## 4. 解説と違った所

実装の前の解説を作っていないので、「作りながら変えた所」を書く。

- TypeScript は、最新の 7 ではなく 6.0 にした（typescript-eslint が 7 にまだ対応していない）。ESLint も、最新の 10 ではなく 9 にした（eslint-config-next の中のプラグインが未対応）
- Chakra UI は、App Router でそのまま使うと Hydration failed になった。Emotion のスタイルをまとめて流す仕組みを足した
- mutation の結果を、スキーマで null にならない形にした（`null false`）。エラーは結果の `errors` に入れる決まりなので、結果そのものが null になる場合がない
- レビュー（実装の経緯を持たないサブエージェント）で、P1 が7件出た。直したもの: 事務スタッフが開始後の予約をキャンセルできた・降順の続きの読み込みと更新の条件と件数の上限のテストがなかった・E2E が走らせる時刻と回数に左右された・スタッフの一覧が今日からになっていなかった。決めていないもの: セッションをサーバーの側で無効にできない（D-009）
- E2E で、医師の画面の「医師」の欄が変えられる状態だと分かった（Chakra の `disabled` が select に効いていなかった）。選択肢を自分だけにした
- 手元の回線は IPv4 が遅く、IPv4 しか使えない Docker のコンテナの中では、gem の取得が止まった。手元に IPv6 優先の中継を立てて入れた（リポジトリには入れていない）

## 5. 数字

| 測ったもの | 結果 | 条件 |
| --- | --- | --- |
| 同じ枠に同時に20件の予約。成功した件数 | UNIQUE を外すと20件／あると1件 | スレッド20本・接続20本。手元の Docker・PostgreSQL 18.7・テスト用の DB。1回ずつ |
| 予約の一覧の SQL の本数 | 3行でも15行でも5本 | RSpec の中で、`sql.active_record` を数えた |
| 空いている枠の SQL の本数 | 2行でも10行でも2本 | 同上 |
| テスト | RSpec 102件・Vitest 22件・Playwright 5件が通る | 2026-11-18・手元 |

測っていないもの: 応答の時間・100万件での実行計画（K3・K4）・画面の表示速度（F1）・CI での実行。

## 6. 自分で説明できるかの問い

1. `book.rb` の `rescue ActiveRecord::RecordNotUnique` を消すと、同じ枠に2人目が来たとき、画面には何が出るか。予約は何件入るか
2. `cancel.rb` の条件付きの更新（`where(status: "booked").update_all`）を、`appointment.update!(status: "canceled")` と書くと、どんなときに困るか
3. 「同時に20件」のテストは、何を確かめていて、何を確かめていないか（ヒント: トランザクションで包んでいない理由・分離レベル・予約の変更）
