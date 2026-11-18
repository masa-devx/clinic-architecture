# ログインのセッション。患者かスタッフの、どちらか片方のもの
class Session < ApplicationRecord
  belongs_to :patient, optional: true
  belongs_to :staff_member, optional: true

  def user = patient || staff_member
end
