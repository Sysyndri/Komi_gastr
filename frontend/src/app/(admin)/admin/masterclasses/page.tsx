"use client";

/**
 * Админ: список мастер-классов с поиском.
 */
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  useMasterClasses,
  useDeleteMasterClass,
} from "@/hooks/useMasterClasses";
import { SearchBar } from "@/components/molecules/SearchBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";

const statusTone = {
  ACTIVE: "green",
  DRAFT: "gray",
  ARCHIVED: "amber",
} as const;

export default function AdminMasterClassesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useMasterClasses({
    search,
    limit: 50,
    status: status || undefined,
  });
  const deleteMutation = useDeleteMasterClass();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить мастер-класс «${title}»? Действие необратимо.`))
      return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Мастер-класс удалён");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Мастер-классы</h1>
        <Link href="/admin/masterclasses/new">
          <Button variant="primary">+ Создать</Button>
        </Link>
      </div>

      <SearchBar placeholder="Поиск по названию..." onSearch={setSearch} />

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Статус:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Все активные</option>
          <option value="ACTIVE">Активные</option>
          <option value="DRAFT">Черновики</option>
          <option value="ARCHIVED">В архиве</option>
        </select>
      </div>

      {query.isLoading && <Spinner />}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">Записей</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.items.map((mc) => (
              <tr
                key={mc.id}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {mc.title}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(mc.date).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {Number(mc.price)} ₽
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {mc.bookingsCount ?? 0}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[mc.status]}>{mc.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/masterclasses/${mc.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Редактировать
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(mc.id, mc.title)}
                      isLoading={deleteMutation.isPending}
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
