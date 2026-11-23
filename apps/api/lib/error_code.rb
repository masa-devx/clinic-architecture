# typed: false

# エラーのコードの一覧（ここだけで決める）。GraphQL の enum と、画面の出し分けは、ここから作る
module ErrorCode
  # 使う人が直せるエラー。mutation の結果の errors に、コードと項目つきで入れる
  USER = {
    "INVALID_INPUT" => "入力に誤りがある",
    "INVALID_CREDENTIALS" => "メールアドレスかパスワードが違う",
    "NOT_FOUND" => "対象が見つからない（ほかの医療機関・ほかの人のものも、見つからないとして返す）",
    "NOT_PERMITTED" => "見えているが、その操作はできない",
    "SLOT_TAKEN" => "枠がすでに埋まっている",
    "SLOT_UNAVAILABLE" => "枠の時刻を過ぎたか、閉じられていて、予約できない",
    "INVALID_STATE" => "今の状態では、その操作はできない",
    "CANCEL_DEADLINE_PASSED" => "キャンセル・変更できる期限を過ぎている",
    "OUTSIDE_TIME_WINDOW" => "受付できる時間の外",
    "CONFLICT" => "ほかの操作とぶつかった。もう一度試せば通ることがある"
  }.freeze

  # リクエスト全体のエラー。GraphQL の errors の extensions.code に入れる
  UNAUTHENTICATED = "UNAUTHENTICATED"
  NOT_FOUND = "NOT_FOUND"
  BAD_REQUEST = "BAD_REQUEST"
  INTERNAL = "INTERNAL"
end
