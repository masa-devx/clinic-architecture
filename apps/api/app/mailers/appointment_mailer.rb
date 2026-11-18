# 予約についての、患者へのメール。文は app/views/appointment_mailer/ にある
class AppointmentMailer < ApplicationMailer
  before_action :load_appointment

  def booking_confirmed = mail(to: @patient.email, subject: "【#{@clinic.name}】ご予約を受け付けました")

  def booking_canceled = mail(to: @patient.email, subject: "【#{@clinic.name}】ご予約をキャンセルしました")

  def reminder
    @check_in_minutes = Appointments::ConsultationRule::CHECK_IN_OPENS_BEFORE.in_minutes.to_i
    mail(to: @patient.email, subject: "【#{@clinic.name}】明日のご予約のお知らせ")
  end


  private

  def load_appointment
    @appointment = params[:appointment]
    @patient = @appointment.patient
    @slot = @appointment.slot
    @clinic = @appointment.clinic
    @doctor = @slot.doctor
    @time = "#{I18n.l(@slot.starts_at.in_time_zone, format: '%Y年%-m月%-d日 %H:%M')}〜#{@slot.ends_at.in_time_zone.strftime('%H:%M')}"
  end
end
