'use client';

/**
 * Layout админ-панели с боковым меню.
 */
import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/organisms/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]" data-testid="admin-layout">
      <AdminSidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}