import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { SalesDashboard } from "@/components/dashboards/sales-dashboard";
import { GMDashboard } from "@/components/dashboards/gm-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect("/auth/login");
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          {userProfile.role === 'Sales' && 'Summary of your sales activities'}
          {userProfile.role === 'GM' && 'Your sales team performance'}
          {userProfile.role === 'Admin' && 'Overall system summary'}
        </p>
      </div>

      {userProfile.role === 'Sales' && <SalesDashboard userId={user.id} />}
      {userProfile.role === 'GM' && <GMDashboard userId={user.id} />}
      {userProfile.role === 'Admin' && <AdminDashboard />}
    </div>
  );
}
