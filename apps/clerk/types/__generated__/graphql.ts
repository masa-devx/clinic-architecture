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

/** 監査ログに残す操作 */
export type AuditAction =
  /** 予約した */
  | 'APPOINTMENT_BOOK'
  /** 予約をキャンセルした */
  | 'APPOINTMENT_CANCEL'
  /** 受付した */
  | 'APPOINTMENT_CHECK_IN'
  /** 診察を終えた */
  | 'APPOINTMENT_FINISH'
  /** 無断キャンセルにした（定期の処理） */
  | 'APPOINTMENT_NO_SHOW'
  /** 予約の時刻を変えた */
  | 'APPOINTMENT_RESCHEDULE'
  /** 診察を始めた */
  | 'APPOINTMENT_START'
  /** 会計を確定した */
  | 'BILL_CONFIRM'
  /** 会計を支払い済にした */
  | 'BILL_PAY'
  /** 会計を返金済にした */
  | 'BILL_REFUND'
  /** 会計の明細を変えた */
  | 'BILL_UPDATE_ITEMS'
  /** 会計を見た */
  | 'BILL_VIEW'
  /** 問診を保存した */
  | 'QUESTIONNAIRE_SAVE'
  /** 問診を見た */
  | 'QUESTIONNAIRE_VIEW';

/** 会計の明細の1行（料金の表の項目と、数量） */
export type BillItemInput = {
  feeItemId: string | number;
  quantity: number;
};

export type BillStatus =
  /** 請求済 */
  | 'BILLED'
  /** 作成中 */
  | 'DRAFT'
  /** 支払い済 */
  | 'PAID'
  /** 返金済 */
  | 'REFUNDED';

/** 診療枠をまとめて作る入力。日付と時刻は日本時間 */
export type CreateSlotsInput = {
  doctorId: string | number;
  /** 時間帯の終わり。HH:MM */
  endTime: string;
  /** 期間の最初の日 */
  from: string;
  /** 1枠の長さ（分） */
  slotMinutes: number;
  /** 時間帯の始まり。HH:MM */
  startTime: string;
  /** 期間の最後の日（この日を含む） */
  to: string;
  /** 曜日。0（日）〜 6（土） */
  weekdays: Array<number>;
};

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

export type ViewerKind =
  /** 事務スタッフ */
  | 'CLERK'
  /** 医師 */
  | 'DOCTOR'
  /** 患者 */
  | 'PATIENT';
