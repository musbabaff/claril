import { DashboardSidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <main className="dash-main">{children}</main>
    </div>
  );
}
