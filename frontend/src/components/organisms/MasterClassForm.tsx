"use client";

/**
 * Форма создания/редактирования мастер-класса.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useCreateMasterClass,
  useUpdateMasterClass,
} from "@/hooks/useMasterClasses";
import { useDishes } from "@/hooks/useDishes";
import { placesApi } from "@/lib/admin.api";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MasterClassFormValues, Status } from "@/types";
import { extractFieldErrors } from "@/lib/api-client";
import {
  validateFields,
  validators,
  type FieldErrors,
  type ValidatorSpec,
} from "@/lib/validators";

/** Поля формы мастер-класса, участвующие в валидации. */
type Field =
  | "title"
  | "shortDescription"
  | "description"
  | "date"
  | "durationMin"
  | "price"
  | "maxParticipants";

/** Правила валидации полей формы мастер-класса. */
const SPEC: ValidatorSpec<Field> = [
  { field: "title", validate: validators.title },
  { field: "shortDescription", validate: validators.shortDescription },
  { field: "description", validate: validators.description },
  { field: "date", validate: validators.date },
  { field: "durationMin", validate: validators.durationMin },
  { field: "price", validate: validators.price },
  { field: "maxParticipants", validate: validators.maxParticipants },
];

export interface MasterClassFormProps {
  initialValues?: Partial<MasterClassFormValues>;
  masterClassId?: string;
}

function toLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MasterClassForm({
  initialValues,
  masterClassId,
}: MasterClassFormProps) {
  const router = useRouter();
  const createMutation = useCreateMasterClass();
  const updateMutation = useUpdateMasterClass();
  const dishesQuery = useDishes({ limit: 50 });
  const placesQuery = useQuery({
    queryKey: ["places"],
    queryFn: () => placesApi.list(),
  });

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [shortDescription, setShortDescription] = useState(
    initialValues?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [date, setDate] = useState(
    initialValues?.date ? toLocalDateTime(initialValues.date) : "",
  );
  const [durationMin, setDurationMin] = useState(
    initialValues?.durationMin ?? 120,
  );
  const [price, setPrice] = useState(initialValues?.price ?? 0);
  const [maxParticipants, setMaxParticipants] = useState(
    initialValues?.maxParticipants ?? 10,
  );
  const [status, setStatus] = useState<Status>(
    initialValues?.status ?? "ACTIVE",
  );
  const [dishId, setDishId] = useState(initialValues?.dishId ?? "");
  const [placeId, setPlaceId] = useState(initialValues?.placeId ?? "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const values: Record<Field, string> = {
      title,
      shortDescription,
      description,
      date,
      durationMin: String(durationMin),
      price: String(price),
      maxParticipants: String(maxParticipants),
    };
    const errors = validateFields(values, SPEC);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Исправьте ошибки в форме");
      return;
    }

    const payload: MasterClassFormValues = {
      title: title.trim(),
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim(),
      date: new Date(date).toISOString(),
      durationMin: Number(durationMin),
      price: Number(price),
      maxParticipants: Number(maxParticipants),
      status,
      dishId: dishId || undefined,
      placeId: placeId || undefined,
    };

    try {
      if (masterClassId) {
        await updateMutation.mutateAsync({ id: masterClassId, input: payload });
        toast.success("Мастер-класс обновлён");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Мастер-класс создан");
      }
      router.push("/admin/masterclasses");
      router.refresh();
    } catch (err) {
      // Ошибки валидации с сервера подсвечиваем под конкретными полями
      setFieldErrors(extractFieldErrors(err) as FieldErrors<Field>);
      setError((err as Error).message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-4"
      data-testid="masterclass-form"
      noValidate
    >
      <Input
        label="Название *"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title}
        placeholder="Например: Шаньга по-ыбтински"
        required
      />
      <Input
        label="Краткое описание (для карточки)"
        name="shortDescription"
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
        error={fieldErrors.shortDescription}
        placeholder="Одно предложение для карточки"
      />
      <Textarea
        label="Описание *"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description}
        rows={4}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Дата и время *"
          type="datetime-local"
          name="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={fieldErrors.date}
          required
        />
        <Input
          label="Длительность (мин)"
          type="number"
          name="durationMin"
          min={15}
          max={600}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          error={fieldErrors.durationMin}
        />
        <Input
          label="Стоимость (₽, 0 — бесплатно)"
          type="number"
          name="price"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          error={fieldErrors.price}
        />
        <Input
          label="Максимум участников"
          type="number"
          name="maxParticipants"
          min={1}
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          error={fieldErrors.maxParticipants}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Связанное блюдо"
          name="dishId"
          value={dishId}
          onChange={(e) => setDishId(e.target.value)}
          options={[
            { value: "", label: "— не выбрано —" },
            ...(dishesQuery.data?.items.map((d) => ({
              value: d.id,
              label: d.name,
            })) ?? []),
          ]}
        />
        <Select
          label="Место проведения"
          name="placeId"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          options={[
            { value: "", label: "— не выбрано —" },
            ...(placesQuery.data?.map((p) => ({
              value: p.id,
              label: p.name,
            })) ?? []),
          ]}
        />
      </div>

      <Select
        label="Статус"
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as Status)}
        options={[
          { value: "ACTIVE", label: "Активен" },
          { value: "DRAFT", label: "Черновик" },
          { value: "ARCHIVED", label: "Архив" },
        ]}
      />

      {error && (
        <p
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          isLoading={createMutation.isPending || updateMutation.isPending}
        >
          {masterClassId ? "Сохранить изменения" : "Создать"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
