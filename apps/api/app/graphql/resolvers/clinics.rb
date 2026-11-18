module Resolvers
  class Clinics < BaseResolver
    description "医療機関の一覧（患者が予約する先を選ぶ）。数が少ない前提で、上限つきの並びで返す"

    MAX = 100

    type [ Types::ClinicType ], null: false

    def resolve = ::Clinic.order(:id).limit(MAX)
  end
end
