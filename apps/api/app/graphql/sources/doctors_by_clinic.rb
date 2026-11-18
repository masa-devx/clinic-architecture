# 医療機関ごとの医師の一覧を、1回の SQL にまとめて読む
module Sources
  class DoctorsByClinic < GraphQL::Dataloader::Source
    def fetch(clinic_ids)
      doctors = StaffMember.doctor.where(clinic_id: clinic_ids).order(:id).group_by(&:clinic_id)
      clinic_ids.map { |clinic_id| doctors.fetch(clinic_id, []) }
    end
  end
end
