import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { SalesDashboard } from "@/components/dashboards/sales-dashboard";
import { GMDashboard } from "@/components/dashboards/gm-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { PresalesDashboard } from "@/components/dashboards/presales-dashboard";
import { EngineerDashboard } from "@/components/dashboards/engineer-dashboard";

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
    <div className="p-6 md:p-8 min-h-screen">
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">📊</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">
              {userProfile.role === 'Sales' && 'Summary of your AM activities'}
              {userProfile.role === 'GM' && 'Your AM team performance'}
              {userProfile.role === 'Admin' && 'Overall system summary'}
              {userProfile.role === 'Presales' && 'System overview (Read-Only)'}
              {userProfile.role === 'Engineer' && 'System overview (Read-Only)'}
        </p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {userProfile.role === 'Sales' && <SalesDashboard userId={user.id} />}
      {userProfile.role === 'GM' && <GMDashboard userId={user.id} />}
      {userProfile.role === 'Admin' && <AdminDashboard />}
      {userProfile.role === 'Presales' && <PresalesDashboard />}
      {userProfile.role === 'Engineer' && <EngineerDashboard />}
      </div>
    </div>
  );
}
