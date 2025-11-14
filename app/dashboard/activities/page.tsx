import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { ActivitiesList } from "@/components/activities/activities-list";

export default async function ActivitiesPage() {
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

  // Get activities based on role
  let query = supabase.from("activities").select(`
    *,
    customers:customer_id(nama_perusahaan),
    activity_types:jenis_aktivitas_id(nama_aktivitas),
    users:sales_id(nama_lengkap)
  `);

  if (userProfile?.role === "Sales") {
    query = query.eq("sales_id", user.id);
  } else if (userProfile?.role === "GM") {
    const { data: subordinates } = await supabase
      .from("users")
      .select("id")
      .eq("gm_id", user.id);
    
    const subordinateIds = subordinates?.map(s => s.id) || [];
    query = query.in("sales_id", subordinateIds.length > 0 ? subordinateIds : [""]);
  }

  const { data: activities } = await query.order("tanggal_aktivitas", { ascending: false });

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Aktivitas Penjualan</h1>
        <p className="text-slate-400 mt-2">Kelola aktivitas penjualan Anda</p>
      </div>

      <ActivitiesList initialActivities={activities || []} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}
