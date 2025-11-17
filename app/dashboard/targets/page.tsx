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

  if (!userProfile) {
    redirect("/dashboard");
  }

  // Get all sales users based on role
  let salesQuery = supabase
    .from("users")
    .select("id, nama_lengkap")
    .eq("role", "Sales");

  if (userProfile.role === "GM") {
    salesQuery = salesQuery.eq("gm_id", user.id);
  } else if (userProfile.role === "Sales") {
    salesQuery = salesQuery.eq("id", user.id);
  }

  const { data: salesUsers } = await salesQuery;

  // Calculate target, potential, and achievement revenue from campaigns per sales
  const salesTargets = [];
  for (const sales of salesUsers || []) {
    // Get all campaigns for this sales
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, target_revenue")
      .eq("sales_id", sales.id);

    // Calculate Target Revenue (sum of all campaign.target_revenue)
    const targetRevenue = (campaigns || []).reduce((sum: number, camp: any) => {
      return sum + (Number(camp.target_revenue) || 0);
    }, 0);

    // Calculate Potential Revenue (latest activity potential_value per campaign, then sum)
    let potentialRevenue = 0;
    for (const campaign of campaigns || []) {
      const { data: activities } = await supabase
        .from("campaign_activities")
        .select("potential_value, tanggal_aktivitas")
        .eq("campaign_id", campaign.id)
        .order("tanggal_aktivitas", { ascending: false })
        .limit(1);
      
      if (activities && activities.length > 0) {
        potentialRevenue += Number(activities[0].potential_value) || 0;
      }
    }

    // Calculate Achievement Revenue (sum of all Closing activities)
    let achievementRevenue = 0;
    for (const campaign of campaigns || []) {
      const { data: closingActivities } = await supabase
        .from("campaign_activities")
        .select("potential_value")
        .eq("campaign_id", campaign.id)
        .eq("jenis_aktivitas", "Closing");
      
      achievementRevenue += (closingActivities || []).reduce((sum: number, act: any) => {
        return sum + (Number(act.potential_value) || 0);
      }, 0);
    }

    salesTargets.push({
      sales_id: sales.id,
      sales_name: sales.nama_lengkap,
      target_revenue: targetRevenue,
      potential_revenue: potentialRevenue,
      achievement_revenue: achievementRevenue,
    });
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Target Penjualan</h1>
        <p className="text-slate-400 mt-2">Ringkasan target, potential, dan achievement revenue dari semua campaign per sales</p>
      </div>

      <TargetsList initialTargets={salesTargets} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}
