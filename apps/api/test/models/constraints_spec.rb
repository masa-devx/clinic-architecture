require "rails_helper"

# アプリのコードを通らない書き込みでも壊れてはいけないことを、DB の制約で守っているかを確かめる
# （検証を飛ばす insert・update_columns で、直接 DB に書く）
RSpec.describe "DB の制約" do
  let(:doctor) { create(:doctor) }
  let(:base) { Time.zone.local(2030, 1, 7, 9) }

  def insert_slot(starts_at, ends_at, doctor: self.doctor, clinic_id: doctor.clinic_id)
    Slot.insert!({ clinic_id: clinic_id, doctor_id: doctor.id, starts_at: starts_at, ends_at: ends_at })
  end

  describe "診療枠" do
    it "同じ医師の、時間が重なる枠は入らない" do
      insert_slot(base, base + 30.minutes)

      expect { insert_slot(base + 15.minutes, base + 45.minutes) }
        .to raise_error(ActiveRecord::StatementInvalid, /slots_no_overlap_per_doctor/)
    end

    it "前の枠の終了と同じ時刻に始まる枠は入る" do
      insert_slot(base, base + 30.minutes)

      expect { insert_slot(base + 30.minutes, base + 60.minutes) }.to change(Slot, :count).by(1)
    end

    it "別の医師なら、同じ時間の枠が入る" do
      insert_slot(base, base + 30.minutes)

      expect { insert_slot(base, base + 30.minutes, doctor: create(:doctor)) }.to change(Slot, :count).by(1)
    end

    it "終了が開始より後でない枠は入らない" do
      expect { insert_slot(base, base) }.to raise_error(ActiveRecord::StatementInvalid, /slots_time_order_check/)
    end

    it "医師の医療機関と違う医療機関の枠は入らない" do
      other_clinic = create(:clinic)

      expect { insert_slot(base, base + 30.minutes, clinic_id: other_clinic.id) }
        .to raise_error(ActiveRecord::InvalidForeignKey)
    end
  end

  describe "予約" do
    let(:slot) { create(:slot, doctor: doctor) }

    def insert_appointment(attributes = {})
      Appointment.insert!({ clinic_id: slot.clinic_id, slot_id: slot.id, patient_id: create(:patient).id, status: "booked" }.merge(attributes))
    end

    it "1つの枠に、有効な予約は2件入らない" do
      insert_appointment

      expect { insert_appointment }.to raise_error(ActiveRecord::RecordNotUnique, /index_appointments_on_slot_id_active/)
    end

    it "キャンセルした予約の枠には、もう一度入る" do
      insert_appointment(status: "canceled", canceled_at: base)

      expect { insert_appointment }.to change(Appointment, :count).by(1)
    end

    it "決めていない状態は入らない" do
      expect { insert_appointment(status: "unknown") }
        .to raise_error(ActiveRecord::StatementInvalid, /appointments_status_check/)
    end

    it "キャンセルなのに、キャンセルした日時がない予約は入らない" do
      expect { insert_appointment(status: "canceled") }
        .to raise_error(ActiveRecord::StatementInvalid, /appointments_canceled_at_check/)
    end

    it "枠の医療機関と違う医療機関の予約は入らない" do
      expect { insert_appointment(clinic_id: create(:clinic).id) }.to raise_error(ActiveRecord::InvalidForeignKey)
    end
  end

  it "決めていない役割のスタッフは入らない" do
    clerk = create(:clerk)

    expect { clerk.update_columns(role: "admin") }
      .to raise_error(ActiveRecord::StatementInvalid, /staff_members_role_check/)
  end
end
