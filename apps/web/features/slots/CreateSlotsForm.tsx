"use client";

import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Fieldset,
  HStack,
  Input,
  NativeSelect,
  Stack,
} from "@chakra-ui/react";
import { ErrorMessage } from "@clinic/ui/state-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useViewer } from "@/lib/auth/viewer-context";
import { addDays, toDateInTokyo } from "@/lib/datetime";
import { applyUserErrors } from "@/lib/errors";
import { WEEKDAYS, createSlotsSchema, type CreateSlotsValues } from "./create-slots-schema";
import { CreateSlotsDocument } from "./slots.graphql";

const FIELDS = ["doctorId", "from", "to", "weekdays", "startTime", "endTime", "slotMinutes"] as const;

// 診療枠を、曜日・時間帯・1枠の長さ・期間から、まとめて作る
export function CreateSlotsForm() {
  const viewer = useViewer();
  // 医師は自分の枠だけを作れるので、選択肢は自分だけ。事務スタッフは、自院の医師から選ぶ。
  // （ほかの医師の id を送っても、サーバーが断る。ここは、選べない物を見せないためだけ）
  const isDoctor = viewer.kind === "DOCTOR";
  const clinicDoctors = viewer.clinic?.doctors ?? [];
  const doctors = isDoctor
    ? clinicDoctors.filter((doctor) => doctor.id === viewer.staffMemberId)
    : clinicDoctors;
  const [tomorrow] = useState(() => addDays(toDateInTokyo(new Date()), 1));

  const [createSlots] = useMutation(CreateSlotsDocument);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [done, setDone] = useState<{ created: number; skipped: number } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSlotsValues>({
    resolver: zodResolver(createSlotsSchema),
    defaultValues: {
      doctorId: doctors[0]?.id ?? "",
      from: tomorrow,
      to: addDays(tomorrow, 13),
      weekdays: [1, 2, 3, 4, 5],
      startTime: "09:00",
      endTime: "12:00",
      slotMinutes: 30,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormErrors([]);
    setDone(null);
    try {
      const result = await createSlots({
        variables: { input: values },
        // 枠が増えたので、「空いている枠」のキャッシュを捨てて、次に開いたときに取り直させる
        update(cache, { data }) {
          if (data?.createSlots.createdCount) {
            cache.evict({ id: "ROOT_QUERY", fieldName: "availableSlots" });
            cache.gc();
          }
        },
      });
      const payload = result.data?.createSlots;
      if (!payload) return;
      if (payload.errors.length > 0) return setFormErrors(applyUserErrors(payload.errors, setError, FIELDS));

      setDone({ created: payload.createdCount ?? 0, skipped: payload.skippedCount ?? 0 });
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="5" maxW="xl">
        {formErrors.map((message) => (
          <ErrorMessage key={message} title={message} />
        ))}
        {done ? (
          <Alert.Root status="success" role="status">
            <Alert.Indicator />
            <Alert.Title>
              {done.created} 枠を作りました
              {done.skipped > 0 ? `（すでにある・時間が重なる ${done.skipped} 枠は飛ばしました）` : ""}
            </Alert.Title>
          </Alert.Root>
        ) : null}

        <Field.Root invalid={!!errors.doctorId}>
          <Field.Label>医師</Field.Label>
          <NativeSelect.Root bg="white">
            <NativeSelect.Field {...register("doctorId")}>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.doctorId?.message}</Field.ErrorText>
        </Field.Root>

        <HStack gap="4" align="start">
          <Field.Root invalid={!!errors.from}>
            <Field.Label>開始日</Field.Label>
            <Input type="date" bg="white" {...register("from")} />
            <Field.ErrorText>{errors.from?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.to}>
            <Field.Label>終了日</Field.Label>
            <Input type="date" bg="white" {...register("to")} />
            <Field.ErrorText>{errors.to?.message}</Field.ErrorText>
          </Field.Root>
        </HStack>

        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <Fieldset.Root invalid={!!errors.weekdays}>
              <Fieldset.Legend>曜日</Fieldset.Legend>
              <HStack gap="4" wrap="wrap">
                {WEEKDAYS.map((weekday) => (
                  <Checkbox.Root
                    key={weekday.value}
                    checked={field.value.includes(weekday.value)}
                    onCheckedChange={({ checked }) =>
                      field.onChange(
                        checked
                          ? [...field.value, weekday.value]
                          : field.value.filter((value) => value !== weekday.value),
                      )
                    }
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{weekday.label}</Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </HStack>
              <Fieldset.ErrorText>{errors.weekdays?.message}</Fieldset.ErrorText>
            </Fieldset.Root>
          )}
        />

        <HStack gap="4" align="start">
          <Field.Root invalid={!!errors.startTime}>
            <Field.Label>開始時刻</Field.Label>
            <Input type="time" bg="white" {...register("startTime")} />
            <Field.ErrorText>{errors.startTime?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.endTime}>
            <Field.Label>終了時刻</Field.Label>
            <Input type="time" bg="white" {...register("endTime")} />
            <Field.ErrorText>{errors.endTime?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.slotMinutes}>
            <Field.Label>1枠の長さ（分）</Field.Label>
            <Input
              type="number"
              bg="white"
              min={5}
              max={240}
              step={5}
              {...register("slotMinutes", { valueAsNumber: true })}
            />
            <Field.ErrorText>{errors.slotMinutes?.message}</Field.ErrorText>
          </Field.Root>
        </HStack>

        {/* 送っているあいだは押せない（2回押しても、2回送らない） */}
        <Button type="submit" colorPalette="blue" alignSelf="start" loading={isSubmitting}>
          診療枠を作る
        </Button>
      </Stack>
    </form>
  );
}
