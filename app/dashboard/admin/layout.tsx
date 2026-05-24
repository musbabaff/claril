import React from 'react';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';
import AdminLayoutClient from './layout-client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireAdmin();
  } catch (error) {
    console.error('Admin layout verification failed:', error);
    redirect('/dashboard');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
