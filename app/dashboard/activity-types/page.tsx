import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { ActivityTypesList } from "@/components/activity-types/activity-types-list";

export default async function ActivityTypesPage() {
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

  if (userProfile?.role !== "Admin") {
    redirect("/dashboard");
  }

  const { data: activityTypes } = await supabase
    .from("activity_types")
    .select("*")
    .order("nama_aktivitas", { ascending: true });

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Master Aktivitas</h1>
        <p className="text-slate-400 mt-2">Kelola jenis aktivitas penjualan</p>
      </div>

      <ActivityTypesList initialTypes={activityTypes || []} />
    </div>
  );
}
