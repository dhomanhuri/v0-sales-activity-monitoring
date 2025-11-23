import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { SalesList } from "@/components/campaigns/sales-list";

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

  // Get sales list based on role with GM info
  let salesQuery = supabase
    .from("users")
    .select(`
      id, 
      nama_lengkap, 
      email, 
      role,
      avatar_url,
      gm_id,
      gm:gm_id(id, nama_lengkap, department)
    `)
    .eq("role", "Sales");

  if (userProfile.role === "Sales") {
    // Sales hanya melihat dirinya sendiri
    salesQuery = salesQuery.eq("id", user.id);
  } else if (userProfile.role === "GM") {
    // GM melihat sales di bawahnya
    salesQuery = salesQuery.eq("gm_id", user.id);
  } else if (userProfile.role === "Presales") {
    // Presales melihat semua sales (read-only)
    // No filter needed
  }
  // Admin dan Presales melihat semua sales

  const { data: sales } = await salesQuery.order("nama_lengkap", { ascending: true });

  // Get campaigns and activities data for each sales
  const salesWithData = await Promise.all(
    (sales || []).map(async (sale: any) => {
      // Get campaigns for this sales
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, target_revenue")
        .eq("sales_id", sale.id);

      // Calculate target revenue
      const targetRevenue = (campaigns || []).reduce(
        (sum: number, camp: any) => sum + (Number(camp.target_revenue) || 0),
        0
      );

      // Get all campaign activities to calculate potential leads and achievement
      let potentialLeads = 0;
      let achievementRevenue = 0;

      for (const campaign of campaigns || []) {
        const { data: activities } = await supabase
          .from("campaign_activities")
          .select("customer_id, potential_value, jenis_aktivitas")
          .eq("campaign_id", campaign.id);

        if (activities && activities.length > 0) {
          // Count unique customers (potential leads)
          const uniqueCustomers = new Set(
            activities.map((act: any) => act.customer_id).filter(Boolean)
          );
          potentialLeads += uniqueCustomers.size;

          // Calculate achievement revenue (sum of closing activities)
          achievementRevenue += activities
            .filter((act: any) => act.jenis_aktivitas === "Closing")
            .reduce((sum: number, act: any) => sum + (Number(act.potential_value) || 0), 0);
        }
      }

      // Calculate achievement rate
      const achievementRate = targetRevenue > 0 
        ? (achievementRevenue / targetRevenue) * 100 
        : 0;

      return {
        ...sale,
        targetRevenue,
        potentialLeads,
        achievementRevenue,
        achievementRate: Math.round(achievementRate * 100) / 100, // Round to 2 decimals
      };
    })
  );

  return (
    <div className="p-6 md:p-8 min-h-screen space-y-6">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">📋</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">AM</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">Select AM to view and manage campaigns</p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SalesList initialSales={salesWithData || []} />
      </div>
    </div>
  );
}

