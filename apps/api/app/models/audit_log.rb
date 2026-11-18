# 監査ログ。足すだけで、変えない・消さない
class AuditLog < ApplicationRecord
  belongs_to :clinic
  belongs_to :patient

  # 残す操作の一覧（ここだけで決める）。GraphQL の enum（AuditAction）は、ここから作る。
  # 画面は、enum の値ごとに呼び方を持つ（apps/web/features/audit/labels.ts。操作を足すと、そちらで型のエラーになる）
  ACTIONS = {
    "appointment.book" => "予約した",
    "appointment.cancel" => "予約をキャンセルした",
    "appointment.reschedule" => "予約の時刻を変えた",
    "appointment.check_in" => "受付した",
    "appointment.start" => "診察を始めた",
    "appointment.finish" => "診察を終えた",
    "appointment.no_show" => "無断キャンセルにした（定期の処理）",
    "questionnaire.save" => "問診を保存した",
    "questionnaire.view" => "問診を見た",
    "bill.update_items" => "会計の明細を変えた",
    "bill.confirm" => "会計を確定した",
    "bill.pay" => "会計を支払い済にした",
    "bill.refund" => "会計を返金済にした",
    "bill.view" => "会計を見た"
  }.freeze

  validates :action, inclusion: { in: ACTIONS.keys }

  # アプリのコードからは、変えられない・消せない。
  # DB の側では縛っていない（トリガーや、書き込みだけの権限のロールが要る。docs/decisions.md の D-015）
  def readonly? = persisted?
end
