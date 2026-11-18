# 利用者の種類。API の入口（GraphQL のスキーマ）と、画面のアプリは、この3つに分かれている
#   patient: 患者 ／ clerk: 事務スタッフ ／ doctor: 医師
module Audience
  ALL = %w[patient clerk doctor].freeze

  module_function

  # その人が、どの入口の利用者か
  def of(user)
    case user
    when Patient then "patient"
    when StaffMember then user.role
    end
  end

  # その入口でログインできる人（メールアドレスとパスワードを、この中から探す）
  def accounts(audience)
    case audience
    when "patient" then Patient.all
    when "clerk" then StaffMember.clerk
    when "doctor" then StaffMember.doctor
    else raise ArgumentError, "知らない入口: #{audience}"
    end
  end
end
