# typed: false

# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_18_000008) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "btree_gist"
  enable_extension "pg_catalog.plpgsql"

  create_table "appointments", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.bigint "slot_id", null: false
    t.bigint "patient_id", null: false
    t.string "status", default: "booked", null: false
    t.datetime "canceled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "booked_by_staff_member_id"
    t.datetime "checked_in_at"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.datetime "no_show_at"
    t.index ["booked_by_staff_member_id"], name: "index_appointments_on_booked_by_staff_member_id"
    t.index ["patient_id"], name: "index_appointments_on_patient_id"
    t.index ["slot_id"], name: "index_appointments_on_slot_id"
    t.index ["slot_id"], name: "index_appointments_on_slot_id_active", unique: true, where: "((status)::text <> 'canceled'::text)"
    t.check_constraint "(status::text = 'canceled'::text) = (canceled_at IS NOT NULL)", name: "appointments_canceled_at_check"
    t.check_constraint "status::text = ANY (ARRAY['booked'::character varying::text, 'checked_in'::character varying::text, 'in_consultation'::character varying::text, 'completed'::character varying::text, 'canceled'::character varying::text, 'no_show'::character varying::text])", name: "appointments_status_check"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.string "actor_type", null: false
    t.bigint "actor_id"
    t.string "action", null: false
    t.bigint "patient_id", null: false
    t.string "subject_type", null: false
    t.bigint "subject_id", null: false
    t.datetime "occurred_at", null: false
    t.index ["clinic_id", "occurred_at", "id"], name: "index_audit_logs_on_clinic_id_and_occurred_at_and_id"
    t.check_constraint "(actor_type::text = ANY (ARRAY['Patient'::character varying, 'StaffMember'::character varying]::text[])) AND actor_id IS NOT NULL OR actor_type::text = 'System'::text AND actor_id IS NULL", name: "audit_logs_actor_check"
  end

  create_table "bill_items", force: :cascade do |t|
    t.bigint "bill_id", null: false
    t.string "name", null: false
    t.integer "unit_price", null: false
    t.integer "quantity", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bill_id"], name: "index_bill_items_on_bill_id"
    t.check_constraint "quantity >= 1 AND quantity <= 99", name: "bill_items_quantity_check"
    t.check_constraint "unit_price >= 0", name: "bill_items_unit_price_check"
  end

  create_table "bills", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.bigint "appointment_id", null: false
    t.string "status", default: "draft", null: false
    t.integer "total_amount"
    t.datetime "billed_at"
    t.datetime "paid_at"
    t.datetime "refunded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_bills_on_appointment_id", unique: true
    t.index ["clinic_id", "status"], name: "index_bills_on_clinic_id_and_status"
    t.check_constraint "(status::text = 'draft'::text) = (total_amount IS NULL)", name: "bills_total_amount_check"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying::text, 'billed'::character varying::text, 'paid'::character varying::text, 'refunded'::character varying::text])", name: "bills_status_check"
    t.check_constraint "total_amount >= 0", name: "bills_total_amount_range_check"
  end

  create_table "clinics", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "fee_items", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.string "name", null: false
    t.integer "unit_price", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clinic_id"], name: "index_fee_items_on_clinic_id"
    t.index ["id", "clinic_id"], name: "index_fee_items_on_id_and_clinic_id", unique: true
    t.check_constraint "unit_price >= 0", name: "fee_items_unit_price_check"
  end

  create_table "outbox_messages", force: :cascade do |t|
    t.string "kind", null: false
    t.bigint "appointment_id", null: false
    t.string "dedup_key", null: false
    t.string "status", default: "pending", null: false
    t.integer "attempts", default: 0, null: false
    t.datetime "locked_until"
    t.datetime "sent_at"
    t.string "last_error"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_outbox_messages_on_appointment_id"
    t.index ["dedup_key"], name: "index_outbox_messages_on_dedup_key", unique: true
    t.index ["id"], name: "index_outbox_messages_pending", where: "((status)::text = 'pending'::text)"
    t.check_constraint "kind::text = ANY (ARRAY['booking_confirmed'::character varying::text, 'booking_canceled'::character varying::text, 'reminder'::character varying::text])", name: "outbox_messages_kind_check"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying::text, 'sent'::character varying::text, 'skipped'::character varying::text, 'failed'::character varying::text])", name: "outbox_messages_status_check"
  end

  create_table "patients", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_patients_on_email", unique: true
  end

  create_table "questionnaire_questions", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.integer "position", null: false
    t.string "label", null: false
    t.string "kind", null: false
    t.jsonb "options", default: [], null: false
    t.boolean "required", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clinic_id", "position"], name: "index_questionnaire_questions_on_clinic_id_and_position", unique: true
    t.check_constraint "kind::text = ANY (ARRAY['text'::character varying::text, 'single'::character varying::text, 'multiple'::character varying::text])", name: "questionnaire_questions_kind_check"
  end

  create_table "questionnaire_responses", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.bigint "appointment_id", null: false
    t.text "payload", null: false
    t.datetime "submitted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_questionnaire_responses_on_appointment_id", unique: true
  end

  create_table "sessions", force: :cascade do |t|
    t.string "token_digest", null: false
    t.bigint "patient_id"
    t.bigint "staff_member_id"
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["patient_id"], name: "index_sessions_on_patient_id"
    t.index ["staff_member_id"], name: "index_sessions_on_staff_member_id"
    t.index ["token_digest"], name: "index_sessions_on_token_digest", unique: true
    t.check_constraint "num_nonnulls(patient_id, staff_member_id) = 1", name: "sessions_one_user_check"
  end

  create_table "slots", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.bigint "doctor_id", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "closed_at"
    t.index ["clinic_id", "starts_at", "id"], name: "index_slots_on_clinic_id_and_starts_at_and_id"
    t.index ["doctor_id", "starts_at"], name: "index_slots_on_doctor_id_and_starts_at", unique: true
    t.index ["id", "clinic_id"], name: "index_slots_on_id_and_clinic_id", unique: true
    t.check_constraint "ends_at > starts_at", name: "slots_time_order_check"
    t.exclusion_constraint "doctor_id WITH =, tstzrange(starts_at, ends_at) WITH &&", using: :gist, name: "slots_no_overlap_per_doctor"
  end

  create_table "solid_queue_batch_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "batch_id", null: false
    t.datetime "created_at", null: false
    t.index ["batch_id"], name: "index_solid_queue_batch_executions_on_batch_id"
    t.index ["job_id"], name: "index_solid_queue_batch_executions_on_job_id", unique: true
  end

  create_table "solid_queue_batches", force: :cascade do |t|
    t.string "active_job_batch_id"
    t.string "description"
    t.text "on_finish"
    t.text "on_success"
    t.text "on_failure"
    t.text "metadata"
    t.integer "total_jobs", default: 0, null: false
    t.integer "completed_jobs", default: 0, null: false
    t.integer "failed_jobs", default: 0, null: false
    t.datetime "enqueued_at"
    t.datetime "finished_at"
    t.datetime "failed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_batch_id"], name: "index_solid_queue_batches_on_active_job_batch_id", unique: true
    t.index ["finished_at"], name: "index_solid_queue_batches_on_finished_at"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "batch_id"
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["batch_id"], name: "index_solid_queue_jobs_on_batch_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "staff_members", force: :cascade do |t|
    t.bigint "clinic_id", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name", null: false
    t.string "role", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "admin", default: false, null: false
    t.index ["clinic_id"], name: "index_staff_members_on_clinic_id"
    t.index ["email"], name: "index_staff_members_on_email", unique: true
    t.index ["id", "clinic_id"], name: "index_staff_members_on_id_and_clinic_id", unique: true
    t.check_constraint "role::text = ANY (ARRAY['doctor'::character varying::text, 'clerk'::character varying::text])", name: "staff_members_role_check"
  end

  add_foreign_key "appointments", "patients"
  add_foreign_key "appointments", "slots", column: ["slot_id", "clinic_id"], primary_key: ["id", "clinic_id"]
  add_foreign_key "appointments", "staff_members", column: "booked_by_staff_member_id"
  add_foreign_key "audit_logs", "clinics"
  add_foreign_key "audit_logs", "patients"
  add_foreign_key "bill_items", "bills"
  add_foreign_key "bills", "appointments"
  add_foreign_key "bills", "clinics"
  add_foreign_key "fee_items", "clinics"
  add_foreign_key "outbox_messages", "appointments"
  add_foreign_key "questionnaire_questions", "clinics"
  add_foreign_key "questionnaire_responses", "appointments"
  add_foreign_key "questionnaire_responses", "clinics"
  add_foreign_key "sessions", "patients"
  add_foreign_key "sessions", "staff_members"
  add_foreign_key "slots", "staff_members", column: ["doctor_id", "clinic_id"], primary_key: ["id", "clinic_id"]
  add_foreign_key "solid_queue_batch_executions", "solid_queue_batches", column: "batch_id", on_delete: :cascade
  add_foreign_key "solid_queue_batch_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "staff_members", "clinics"
end
