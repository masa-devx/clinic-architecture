# typed: false

# 「見た」の監査ログを、1回のリクエストの分をためて、1回の SQL（まとめて INSERT）で入れる。
# 一覧で、行ごとに問診の答えや会計の明細を読んでも、INSERT は1本で済む
module Sources
  class AuditView < GraphQL::Dataloader::Source
    def initialize(actor_type, actor_id, now)
      @actor_type = actor_type
      @actor_id = actor_id
      @now = now
    end

    # keys は [操作, 医療機関の id, 患者の id, 何を（種類）, 何を（id）] の並び
    def fetch(keys)
      AuditLog.insert_all!(keys.map do |action, clinic_id, patient_id, subject_type, subject_id|
        {
          clinic_id: clinic_id, actor_type: @actor_type, actor_id: @actor_id, action: action,
          patient_id: patient_id, subject_type: subject_type, subject_id: subject_id, occurred_at: @now
        }
      end)
      keys.map { true }
    end
  end
end
