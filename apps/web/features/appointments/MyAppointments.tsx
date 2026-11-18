"use client";

import { Tabs } from "@chakra-ui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { addDays, toDateInTokyo } from "@/lib/datetime";
import { AppointmentList } from "./AppointmentList";

type Tab = "upcoming" | "past";

// 患者の「自分の予約」。これからの予約と、過去の予約を、タブで分ける。開いているタブは URL に置く
const rescheduleHref = (appointmentId: string, clinicId: string) =>
  `/book/${clinicId}?reschedule=${appointmentId}`;

export function MyAppointments() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  // 「今日」は、画面を開いたときに1回だけ決める（描き直しのたびに変わると、一覧を取り直してしまう）
  const [today] = useState(() => toDateInTokyo(new Date()));

  return (
    <Tabs.Root
      value={tab}
      onValueChange={({ value }) => router.replace(value === "past" ? `${pathname}?tab=past` : pathname)}
      lazyMount
    >
      <Tabs.List mb="4">
        <Tabs.Trigger value="upcoming">これからの予約</Tabs.Trigger>
        <Tabs.Trigger value="past">過去の予約</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="upcoming">
        <AppointmentList
          filter={{ from: today }}
          showPatient={false}
          showClinic
          emptyTitle="これからの予約はありません"
          rescheduleHref={rescheduleHref}
          questionnaireHref={(appointmentId) => `/appointments/${appointmentId}/questionnaire`}
          billHref={(billId) => `/bills/${billId}`}
        />
      </Tabs.Content>
      <Tabs.Content value="past">
        <AppointmentList
          filter={{ to: addDays(today, -1) }}
          descending
          showPatient={false}
          showClinic
          emptyTitle="過去の予約はありません"
          rescheduleHref={rescheduleHref}
          questionnaireHref={(appointmentId) => `/appointments/${appointmentId}/questionnaire`}
          billHref={(billId) => `/bills/${billId}`}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}
