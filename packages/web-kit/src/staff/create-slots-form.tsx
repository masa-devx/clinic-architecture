"use client";

import {
  Alert,
  Button,
  Checkbox,
  Field,
  Fieldset,
  HStack,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";
import { ErrorMessage } from "@clinic/ui/state-message";
import { Surface } from "@clinic/ui/surface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { addDays, toDateInTokyo } from "../datetime";
import { applyUserErrors, type UserError } from "../errors";
import { WEEKDAYS, createSlotsSchema, type CreateSlotsValues } from "./create-slots-schema";

const FIELDS = ["doctorId", "from", "to", "weekdays", "startTime", "endTime", "slotMinutes"] as const;

type Result = { errors: readonly UserError[]; createdCount?: number | null; skippedCount?: number | null };

type Props = {
  // 枠を作れる医師。医師の画面では自分だけ、事務スタッフの画面では自院の全員を渡す
  // （ほかの医師の id を送っても、サーバーが断る。ここは、選べない物を見せないためだけ）
  doctors: readonly { id: string; name: string }[];
  // 作る操作を送る。通信に失敗したら null
  onSubmit: (values: CreateSlotsValues) => Promise<Result | null>;
};

// 診療枠を、曜日・時間帯・1枠の長さ・期間から、まとめて作るフォーム。事務スタッフと医師の画面で共通
export function CreateSlotsForm({ doctors, onSubmit }: Props) {
  const [tomorrow] = useState(() => addDays(toDateInTokyo(new Date()), 1));
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

  const submit = handleSubmit(async (values) => {
    setFormErrors([]);
    setDone(null);
    const result = await onSubmit(values);
    if (!result) return;
    if (result.errors.length > 0) return setFormErrors(applyUserErrors(result.errors, setError, FIELDS));

    setDone({ created: result.createdCount ?? 0, skipped: result.skippedCount ?? 0 });
  });

  return (
    <Surface maxW="2xl">
      <form onSubmit={submit} noValidate>
        <Stack gap="6">
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
            <NativeSelect.Root>
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

          <SimpleGrid columns={2} gap="4">
            <Field.Root invalid={!!errors.from}>
              <Field.Label>開始日</Field.Label>
              <Input type="date" {...register("from")} />
              <Field.ErrorText>{errors.from?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.to}>
              <Field.Label>終了日</Field.Label>
              <Input type="date" {...register("to")} />
              <Field.ErrorText>{errors.to?.message}</Field.ErrorText>
            </Field.Root>
          </SimpleGrid>

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
                      colorPalette="teal"
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

          <SimpleGrid columns={3} gap="4">
            <Field.Root invalid={!!errors.startTime}>
              <Field.Label>開始時刻</Field.Label>
              <Input type="time" {...register("startTime")} />
              <Field.ErrorText>{errors.startTime?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.endTime}>
              <Field.Label>終了時刻</Field.Label>
              <Input type="time" {...register("endTime")} />
              <Field.ErrorText>{errors.endTime?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.slotMinutes}>
              <Field.Label>1枠の長さ（分）</Field.Label>
              <Input
                type="number"
                min={5}
                max={240}
                step={5}
                {...register("slotMinutes", { valueAsNumber: true })}
              />
              <Field.ErrorText>{errors.slotMinutes?.message}</Field.ErrorText>
            </Field.Root>
          </SimpleGrid>

          {/* 送っているあいだは押せない（2回押しても、2回送らない） */}
          <Button type="submit" colorPalette="teal" alignSelf="start" loading={isSubmitting}>
            診療枠を作る
          </Button>
        </Stack>
      </form>
    </Surface>
  );
}
