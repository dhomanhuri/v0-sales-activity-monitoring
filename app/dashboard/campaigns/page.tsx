import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { CampaignsList } from "@/components/campaigns/campaigns-list";

export default async function CampaignsPage() {
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

  // Get campaigns based on role
  let query = supabase.from("campaigns").select(`
    *,
    master_customers:customer_id(name),
    master_campaigns:campaign_id(name),
    users:sales_id(nama_lengkap)
  `);

  if (userProfile.role === "Sales") {
    query = query.eq("sales_id", user.id);
  } else if (userProfile.role === "GM") {
    const { data: subordinates } = await supabase
      .from("users")
      .select("id")
      .eq("gm_id", user.id);
    
    const subordinateIds = subordinates?.map(s => s.id) || [];
    query = query.in("sales_id", subordinateIds.length > 0 ? subordinateIds : [""]);
  }

  const { data: campaigns } = await query.order("created_at", { ascending: false });

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Campaign</h1>
        <p className="text-slate-400 mt-2">Kelola campaign penjualan</p>
      </div>

      <CampaignsList initialCampaigns={campaigns || []} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}

