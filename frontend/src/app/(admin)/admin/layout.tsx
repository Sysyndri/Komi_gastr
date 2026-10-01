'use client';

/**
 * Layout админ-панели с боковым меню.
 */
import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/organisms/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row" data-testid="admin-layout">
      <AdminSidebar />
      <div className="min-w-0 flex-1 p-4 lg:p-6">{children}</div>
    </div>
  );
}