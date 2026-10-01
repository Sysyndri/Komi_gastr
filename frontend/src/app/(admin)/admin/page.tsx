'use client';

/**
 * Админ-дашборд: ключевая статистика.
 */
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/admin.api';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

interface MetricCardProps {
  label: string;
  value: number | string;
  tone?: 'primary' | 'nordic' | 'accent' | 'gray';
  suffix?: string;
}

function MetricCard({ label, value, tone = 'primary', suffix }: MetricCardProps) {
  const toneClass = {
    primary: 'bg-primary-50 text-primary-700',
    nordic: 'bg-blue-50 text-nordic',
    accent: 'bg-amber-50 text-accent',
    gray: 'bg-gray-100 text-gray-700',
  }[tone];

  return (
    <Card className="p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${toneClass}`} data-testid="metric-value">
        {value}
        {suffix && <span className="ml-1 text-base font-normal">{suffix}</span>}
      </p>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: () => statsApi.getStats() });

  if (statsQuery.isLoading) return <Spinner label="Загружаем статистику..." />;
  if (statsQuery.isError || !statsQuery.data) {
    return <p className="py-8 text-center text-red-600">Не удалось загрузить статистику.</p>;
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Дашборд</h1>
        <Badge tone={stats.userGrowth >= 0 ? 'green' : 'red'}>
          Рост пользователей: {stats.userGrowth >= 0 ? '+' : ''}
          {stats.userGrowth}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Пользователей" value={stats.users} tone="nordic" />
        <MetricCard label="Мастер-классов" value={stats.masterClasses} tone="primary" />
        <MetricCard label="Мероприятий" value={stats.events} tone="accent" />
        <MetricCard label="Блюд" value={stats.dishes} tone="gray" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Записей на МК" value={stats.bookings} tone="primary" />
        <MetricCard label="Записей на события" value={stats.eventBookings} tone="nordic" />
        <MetricCard label="Выручка" value={stats.revenue.toLocaleString('ru-RU')} suffix="₽" tone="accent" />
        <MetricCard label="Средняя цена МК" value={stats.avgPrice.toLocaleString('ru-RU')} suffix="₽" tone="gray" />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Популярные мастер-классы</h2>
        {stats.topMasterClasses.length === 0 ? (
          <p className="text-sm text-gray-500">Пока нет данных.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Название</th>
                <th className="pb-2">Дата</th>
                <th className="pb-2 text-right">Цена</th>
                <th className="pb-2 text-right">Записей</th>
              </tr>
            </thead>
            <tbody>
              {stats.topMasterClasses.map((mc) => (
                <tr key={mc.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{mc.title}</td>
                  <td className="py-2 text-gray-600">
                    {new Date(mc.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-2 text-right text-gray-700">{Number(mc.price)} ₽</td>
                  <td className="py-2 text-right font-semibold text-primary-700">{mc._count.bookings}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}