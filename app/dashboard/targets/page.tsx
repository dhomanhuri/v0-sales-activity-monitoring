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

  // Only GMs and Admins can access targets
  if (!userProfile || !["GM", "Admin"].includes(userProfile.role)) {
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
  }

  const { data: targets } = await query.order("periode_tahun", { ascending: false });

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Target Penjualan</h1>
        <p className="text-slate-400 mt-2">Kelola target penjualan tim Anda</p>
      </div>

      <TargetsList initialTargets={targets || []} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}
