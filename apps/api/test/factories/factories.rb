# typed: false

FactoryBot.define do
  factory :clinic do
    sequence(:name) { |n| "テスト医療機関#{n}" }
  end

  factory :patient do
    sequence(:email) { |n| "patient#{n}@example.com" }
    sequence(:name) { |n| "患者#{n}" }
    password { "test-password" }
  end

  factory :staff_member do
    clinic
    sequence(:email) { |n| "staff#{n}@example.com" }
    sequence(:name) { |n| "スタッフ#{n}" }
    password { "test-password" }
    role { :clerk }

    factory :doctor do
      role { :doctor }
    end

    factory :clerk do
      role { :clerk }
    end
  end

  factory :slot do
    doctor
    clinic { doctor.clinic }
    # 同じ医師の枠が重ならないように、1件ごとに1時間ずつずらす
    sequence(:starts_at) { |n| Time.zone.local(2030, 1, 7, 9) + n.hours }
    ends_at { starts_at + 30.minutes }
  end

  factory :appointment do
    slot
    clinic { slot.clinic }
    patient
    status { :booked }

    trait :canceled do
      status { :canceled }
      canceled_at { Time.zone.local(2030, 1, 1) }
    end
  end

  factory :fee_item do
    clinic
    sequence(:name) { |n| "料金の項目#{n}" }
    unit_price { 1_000 }
  end

  factory :bill do
    appointment { association :appointment, status: :completed }
    clinic { appointment.clinic }
    status { :draft }
  end

  factory :bill_item do
    bill
    name { "再診料" }
    unit_price { 730 }
    quantity { 1 }
  end

  factory :questionnaire_question do
    clinic
    sequence(:position) { |n| n }
    sequence(:label) { |n| "質問#{n}" }
    kind { :text }
    options { [] }
    required { false }
  end
end
