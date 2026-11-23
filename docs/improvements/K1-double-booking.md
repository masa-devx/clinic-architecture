# K1. 同じ枠に、同時に2件の予約が入る

- 日付: 2026-11-18 ／ 段階: 1 ／ 関係する判断: [D-004](../decisions.md)

進め方を「最初からきちんと作る」に変えたので（D-002）、素朴な作りを先に動かしてはいない。「前」は、テスト用の DB から UNIQUE を一時的に外して測った。

## 1. 症状

「枠が空いているかを確かめてから、予約を入れる」形だと、同じ枠に同時に来た予約が、どれも「空いている」と判断して入る。

## 2. 測った

同じ枠に、別々の患者20人の予約を、同時に送るテスト（`apps/api/test/services/appointments/book_spec.rb` の「同じ枠に、同時に20件の予約が来たとき」）。スレッド20本が、それぞれ別の接続で `Appointments::Book` を呼ぶ。全員の準備ができてから、同時に走り出す。

```sh
docker compose run --rm api bundle exec rspec test/services/appointments/book_spec.rb -e "同時に20件"
```

「前」は、テスト用の DB で `DROP INDEX index_appointments_on_slot_id_active` を流してから、同じテストを走らせた。

## 3. 原因

確かめる SQL と入れる SQL のあいだに、ほかのトランザクションが入れる。PostgreSQL の既定の分離レベル（READ COMMITTED）では、まだコミットされていない他の人の予約は見えないので、全員が「空いている」と判断する。

## 4. 直した

部分 UNIQUE（`appointments(slot_id) WHERE status <> 'canceled'`）で、DB に1件だけ通してもらう。アプリは、確かめずに INSERT して、UNIQUE に当たったら「すでに埋まっています」を返す。比べた案（行のロック・枠の側に状態）と理由は D-004。

## 5. 数字

| | 前（UNIQUE を外した） | 後（UNIQUE あり） |
| --- | --- | --- |
| 20件中、成功した予約 | 20件 | 1件 |
| 残りの結果 | — | 19件が `SLOT_TAKEN` |

測った条件: 同時に20件（スレッド20本・接続20本）。手元の Docker（PostgreSQL 18.7）のテスト用の DB。測ったのは1回ずつ。本番の数字ではない。

## 6. 再発防止

- 上のテストが、RSpec の中で毎回走る（CI にも入れた。CI での実行は未確認）
- `apps/api/test/models/constraints_spec.rb` が、検証を飛ばして直接 DB に書いても2件目が入らないことを確かめる
