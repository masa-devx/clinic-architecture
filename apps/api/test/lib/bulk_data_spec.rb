# typed: false

require "rails_helper"

# 計測用の大量のデータ（bin/rails bulk:load）を、小さい件数で入れて確かめる。
# モデルを通さず SQL で入れるので、入った行がアプリのモデルから見ても正しいかを、ここで確かめる
RSpec.describe BulkData do
  subject(:bulk) do
    described_class.new(appointments: 600, patients: 50, clinics: 3, doctors_per_clinic: 2, doctors_in_big_clinic: 5)
  end

  # 何度も流す、手元のコマンドなので、出力は捨てる
  around { |example| expect { example.run }.to output.to_stdout }

  let(:clinics) { Clinic.where("name LIKE ?", "#{BulkData::CLINIC_NAME_PREFIX}%") }

  describe "正常系" do
    it "決めた件数が入り、DB の制約（CHECK・外部キー・排他制約）を通る" do
      counts = bulk.load(vacuum: false)

      expect(counts).to include("医療機関" => 3, "医師" => 9, "患者" => 50, "予約" => 600)
      expect(counts["診療枠"]).to be > 600
      # 会計は、診察済の予約にだけ、1つずつ
      expect(counts["会計"]).to eq(Appointment.where(clinic: clinics, status: :completed).count)
    end

    it "1院だけ医師が多く、予約が偏る" do
      bulk.load(vacuum: false)

      per_clinic = Appointment.where(clinic: clinics).group(:clinic_id).count.values.sort
      expect(per_clinic.last).to be > per_clinic.first * 2
    end

    it "過去と、今より後の両方に予約があり、状態が時刻と合っている" do
      bulk.load(vacuum: false)

      appointments = Appointment.where(clinic: clinics).joins(:slot)
      expect(appointments.where(slots: { starts_at: ...Time.current }).distinct.pluck(:status)).not_to include("booked")
      expect(appointments.where(slots: { starts_at: Time.current.. }).distinct.pluck(:status)).to contain_exactly("booked", "canceled")
      expect(Appointment.where(clinic: clinics, status: :completed).where(completed_at: nil)).to be_empty
    end

    it "入れたスタッフと患者で、ログインできる（パスワードの暗号が正しい）" do
      bulk.load(vacuum: false)

      expect(StaffMember.authenticate_by(email: "clerk1@#{BulkData::EMAIL_DOMAIN}", password: BulkData::PASSWORD)).to be_present
      expect(Patient.authenticate_by(email: "patient1@#{BulkData::EMAIL_DOMAIN}", password: BulkData::PASSWORD)).to be_present
    end
  end

  describe "異常系" do
    it "入れ直しても増えず、計測用でないデータには触らない" do
      other = create(:appointment)
      bulk.load(vacuum: false)
      bulk.load(vacuum: false)

      expect(Appointment.where(clinic: clinics).count).to eq(600)
      expect(Appointment.exists?(other.id)).to be(true)

      bulk.clear
      expect(clinics).to be_empty
      expect(Patient.where("email LIKE ?", "%@#{BulkData::EMAIL_DOMAIN}")).to be_empty
      expect(Appointment.exists?(other.id)).to be(true)
    end
  end
end
