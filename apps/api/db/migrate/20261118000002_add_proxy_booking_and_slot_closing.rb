# typed: false

# 事務スタッフの代理の予約（誰が入れたかを残す）と、診療枠を閉じる
class AddProxyBookingAndSlotClosing < ActiveRecord::Migration[8.1]
  def change
    # 患者が自分で入れた予約は NULL。事務スタッフが代わりに入れた予約は、そのスタッフ
    add_reference :appointments, :booked_by_staff_member, foreign_key: { to_table: :staff_members }
    # 閉じた日時。NULL なら開いている。閉じた枠は、空いている枠に出ず、予約できない
    add_column :slots, :closed_at, :datetime
  end
end
