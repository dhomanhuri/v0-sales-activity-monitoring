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

    // Calculate Potential Revenue (akumulasi potential value terakhir tiap customer per campaign)
    let potentialRevenue = 0;
    for (const campaign of campaigns || []) {
      const { data: activities } = await supabase
        .from("campaign_activities")
        .select("customer_id, potential_value, tanggal_aktivitas, created_at")
        .eq("campaign_id", campaign.id);
      
      if (activities && activities.length > 0) {
        // Filter out activities without customer_id
        const activitiesWithCustomer = activities.filter(a => a.customer_id);
        
        if (activitiesWithCustomer.length > 0) {
          // Sort by tanggal_aktivitas descending (with created_at as fallback)
          // If dates are equal, use created_at as secondary sort
          const sortedActivities = [...activitiesWithCustomer].sort((a, b) => {
            const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
            const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
            if (dateB !== dateA) {
              return dateB - dateA;
            }
            // If dates are equal, sort by created_at descending
            const createdA = new Date(a.created_at || 0).getTime();
            const createdB = new Date(b.created_at || 0).getTime();
            return createdB - createdA;
          });
          
          // Group by customer_id, keep only latest activity per customer
          const customerLatestActivity = new Map<string, any>();
          
          for (const activity of sortedActivities) {
            const customerId = activity.customer_id;
            if (customerId && !customerLatestActivity.has(customerId)) {
              customerLatestActivity.set(customerId, activity);
            }
          }
          
          // Sum potential_value from latest activities per customer
          for (const activity of customerLatestActivity.values()) {
            // Ensure we parse the value correctly, handling null, undefined, and empty strings
            const value = activity.potential_value != null 
              ? Number(activity.potential_value) 
              : 0;
            if (!isNaN(value)) {
              potentialRevenue += value;
            }
          }
        }
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
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Target Penjualan</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Ringkasan target, potential, dan achievement revenue dari semua campaign per sales</p>
      </div>

      <TargetsList initialTargets={salesTargets} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}
