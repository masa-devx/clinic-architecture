"use client";

import { Field, HStack, Input, NativeSelect } from "@chakra-ui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useViewer } from "@/lib/auth/viewer-context";
import { toDateInTokyo } from "@/lib/datetime";
import { AppointmentList } from "./AppointmentList";
import { staffFilterFromParams, withFilter, type FilterKey } from "./filters";
import { STATUSES, STATUS_LABELS } from "./status";

// スタッフの予約の一覧。事務スタッフは自院の全部、医師は自分が担当の予約（絞るのはサーバー）。
// 絞り込み（日付・医師・状態）は URL に置く。リロードしても、URL を渡しても、同じ一覧になる。
// 開いたときは「今日から」（医師なら、今日の自分の予約が最初に出る）。「この日から」を空にすると、過去も出る
export function StaffAppointments() {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 「今日」は、画面を開いたときに1回だけ決める
  const [today] = useState(() => toDateInTokyo(new Date()));
  const filter = staffFilterFromParams(searchParams, today);

  const setFilter = (key: FilterKey, value: string) => {
    const query = withFilter(searchParams.toString(), key, value);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <HStack
        as="form"
        gap="4"
        mb="5"
        wrap="wrap"
        align="end"
        aria-label="絞り込み"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field.Root width="auto">
          <Field.Label>この日から</Field.Label>
          <Input
            type="date"
            bg="white"
            value={filter.from ?? ""}
            onChange={(event) => setFilter("from", event.target.value)}
          />
        </Field.Root>
        <Field.Root width="auto">
          <Field.Label>この日まで</Field.Label>
          <Input
            type="date"
            bg="white"
            value={filter.to ?? ""}
            onChange={(event) => setFilter("to", event.target.value)}
          />
        </Field.Root>
        {/* 医師には自分の予約しか出ないので、医師で絞る欄は事務スタッフにだけ出す */}
        {viewer.kind === "CLERK" ? (
          <Field.Root width="auto">
            <Field.Label>医師</Field.Label>
            <NativeSelect.Root bg="white">
              <NativeSelect.Field
                value={filter.doctorId ?? ""}
                onChange={(event) => setFilter("doctor", event.target.value)}
              >
                <option value="">全員</option>
                {viewer.clinic?.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        ) : null}
        <Field.Root width="auto">
          <Field.Label>状態</Field.Label>
          <NativeSelect.Root bg="white">
            <NativeSelect.Field
              value={filter.status ?? ""}
              onChange={(event) => setFilter("status", event.target.value)}
            >
              <option value="">すべて</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </HStack>
      <AppointmentList
        filter={filter}
        showPatient
        showClinic={false}
        emptyTitle="条件に合う予約はありません"
        rescheduleHref={(appointmentId) => `/staff/book?reschedule=${appointmentId}`}
        questionnaireHref={(appointmentId) => `/staff/appointments/${appointmentId}/questionnaire`}
        billHref={(billId) => `/staff/bills/${billId}`}
      />
    </>
  );
}
