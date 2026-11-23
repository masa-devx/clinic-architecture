/** 予約の一覧の絞り込み。日付は日本時間で、from・to の日を含む */
export type AppointmentFilter = {
  doctorId?: string | number | null | undefined;
  from?: string | null | undefined;
  status?: AppointmentStatus | null | undefined;
  to?: string | null | undefined;
};

export type AppointmentStatus =
  /** 予約済 */
  | 'BOOKED'
  /** キャンセル */
  | 'CANCELED'
  /** 受付済 */
  | 'CHECKED_IN'
  /** 診察済 */
  | 'COMPLETED'
  /** 診察中 */
  | 'IN_CONSULTATION'
  /** 無断キャンセル */
  | 'NO_SHOW';

export type BillStatus =
  /** 請求済 */
  | 'BILLED'
  /** 作成中 */
  | 'DRAFT'
  /** 支払い済 */
  | 'PAID'
  /** 返金済 */
  | 'REFUNDED';

/** 使う人が直せるエラーの種類 */
export type ErrorCode =
  /** キャンセル・変更できる期限を過ぎている */
  | 'CANCEL_DEADLINE_PASSED'
  /** ほかの操作とぶつかった。もう一度試せば通ることがある */
  | 'CONFLICT'
  /** メールアドレスかパスワードが違う */
  | 'INVALID_CREDENTIALS'
  /** 入力に誤りがある */
  | 'INVALID_INPUT'
  /** 今の状態では、その操作はできない */
  | 'INVALID_STATE'
  /** 対象が見つからない（ほかの医療機関・ほかの人のものも、見つからないとして返す） */
  | 'NOT_FOUND'
  /** 見えているが、その操作はできない */
  | 'NOT_PERMITTED'
  /** 受付できる時間の外 */
  | 'OUTSIDE_TIME_WINDOW'
  /** 枠がすでに埋まっている */
  | 'SLOT_TAKEN'
  /** 枠の時刻を過ぎたか、閉じられていて、予約できない */
  | 'SLOT_UNAVAILABLE';

export type QuestionKind =
  /** 複数選択 */
  | 'MULTIPLE'
  /** 選択（1つ） */
  | 'SINGLE'
  /** 文章 */
  | 'TEXT';

/** 問診の答えの1つ。文章・選択は text、複数選択は selected に入れる */
export type QuestionnaireAnswerInput = {
  questionId: string | number;
  selected?: Array<string> | null | undefined;
  text?: string | null | undefined;
};

export type ViewerKind =
  /** 事務スタッフ */
  | 'CLERK'
  /** 医師 */
  | 'DOCTOR'
  /** 患者 */
  | 'PATIENT';
