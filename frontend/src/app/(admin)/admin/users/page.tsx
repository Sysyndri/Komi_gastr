'use client';

/**
 * Админ: управление пользователями (роли, блокировка).
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin.api';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.listUsers({ search, limit: 50 }),
  });

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminApi.changeRole(id, role);
      toast.success('Роль обновлена');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleToggleBlock = async (id: string, name: string) => {
    try {
      const res = await adminApi.toggleBlock(id);
      toast.success(res.isBlocked ? `Пользователь «${name}» заблокирован` : `Пользователь «${name}» разблокирован`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Пользователи</h1>

      <SearchBar placeholder="Поиск по имени или email..." onSearch={setSearch} />

      {query.isLoading && <Spinner />}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Имя</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.items.map((user) => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    data-testid="role-select"
                  >
                    <option value="USER">USER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={user.isBlocked ? 'red' : 'green'}>
                    {user.isBlocked ? 'Заблокирован' : 'Активен'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant={user.isBlocked ? 'outline' : 'danger'}
                    size="sm"
                    disabled={user.role === 'ADMIN'}
                    onClick={() => void handleToggleBlock(user.id, user.name)}
                  >
                    {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}