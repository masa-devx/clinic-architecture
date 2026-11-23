require "rails_helper"

RSpec.describe AppointmentPolicy do
  let(:slot) { create(:slot) }
  let!(:appointment) { create(:appointment, slot: slot) }
  let!(:other_clinic_appointment) { create(:appointment) }

  # 見える・キャンセルできる、を、役割ごとに表にして確かめる（要件の4章）
  def self.check_roles(table)
    table.each do |who, (user, can_show, can_cancel)|
      it "#{who}は、#{can_show ? '見られる' : '見られない'}・#{can_cancel ? 'キャンセルできる' : 'キャンセルできない'}" do
        actor = instance_exec(&user)

        expect(described_class.new(actor, appointment).show?).to eq(can_show)
        expect(described_class.new(actor, appointment).cancel?).to eq(can_cancel)
        expect(described_class.scope(actor).exists?(appointment.id)).to eq(can_show)
      end
    end
  end

  describe "正常系" do
    # 予約に関わる人は、見られる（医師は、見られるがキャンセルはできない）
    check_roles(
      "予約した患者" => [ -> { appointment.patient }, true, true ],
      "自院の事務スタッフ" => [ -> { create(:clerk, clinic: slot.clinic) }, true, true ],
      "担当の医師" => [ -> { slot.doctor }, true, false ]
    )
  end

  describe "異常系" do
    # 予約に関わらない人は、見られず、キャンセルもできない
    check_roles(
      "ほかの患者" => [ -> { create(:patient) }, false, false ],
      "他院の事務スタッフ" => [ -> { create(:clerk) }, false, false ],
      "自院の、担当でない医師" => [ -> { create(:doctor, clinic: slot.clinic) }, false, false ],
      "他院の医師" => [ -> { create(:doctor) }, false, false ],
      "ログインしていない人" => [ -> { nil }, false, false ]
    )
  end
end
