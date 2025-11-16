import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { TargetsList } from "@/components/targets/targets-list";

export default async function TargetsPage() {
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

  // Allow Sales to view (read-only), GM/Admin full access
  if (!userProfile) {
    redirect("/dashboard");
  }

  // Get targets
  let query = supabase.from("targets").select(`
    *,
    users:sales_id(nama_lengkap),
    gm:gm_id(nama_lengkap)
  `);

  if (userProfile.role === "GM") {
    query = query.eq("gm_id", user.id);
  } else if (userProfile.role === "Sales") {
    query = query.eq("sales_id", user.id);
  }

  const { data: targets } = await query.order("periode_tahun", { ascending: false });

  // Compute actual_revenue per target from activities with type 'Closing' and status 'Selesai'
  let closingTypeId: string | null = null;
  {
    const { data: closingType } = await supabase
      .from("activity_types")
      .select("id")
      .eq("nama_aktivitas", "Closing")
      .single();
    closingTypeId = closingType?.id || null;
  }

  const targetsWithActual = [];
  for (const target of targets || []) {
    let actualRevenue = 0;
    if (closingTypeId) {
      const startDate = `${target.periode_tahun}-01-01`;
      const endDate = `${target.periode_tahun}-12-31`;
      const { data: closingActivities } = await supabase
        .from("activities")
        .select("customers:customer_id(nilai_potensial)")
        .eq("sales_id", target.sales_id)
        .eq("jenis_aktivitas_id", closingTypeId)
        .eq("status_aktivitas", "Selesai")
        .gte("tanggal_aktivitas", startDate)
        .lte("tanggal_aktivitas", endDate);
      actualRevenue = (closingActivities || []).reduce((sum: number, row: any) => {
        return sum + (row.customers?.nilai_potensial ? Number(row.customers.nilai_potensial) : 0);
      }, 0);
    }
    targetsWithActual.push({ ...target, actual_revenue: actualRevenue });
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Target Penjualan</h1>
        <p className="text-slate-400 mt-2">Kelola target penjualan tim Anda</p>
      </div>

      <TargetsList initialTargets={targetsWithActual} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}
