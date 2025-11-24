import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from 'next/navigation';
import { SalesDetail } from "@/components/campaigns/sales-detail";

export default async function SalesDetailPage({ params }: { params: Promise<{ salesId: string }> }) {
  const { salesId } = await params;
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

  // Get sales user
  const { data: sales } = await supabase
    .from("users")
    .select("id, nama_lengkap, email, role")
    .eq("id", salesId)
    .eq("role", "Sales")
    .single();

  if (!sales) {
    notFound();
  }

  // Check access
  if (userProfile.role === "Sales" && sales.id !== user.id) {
    redirect("/dashboard/campaigns");
  } else if (userProfile.role === "GM") {
    const { data: salesUser } = await supabase
      .from("users")
      .select("gm_id")
      .eq("id", sales.id)
      .single();
    
    if (salesUser?.gm_id !== user.id) {
      redirect("/dashboard/campaigns");
    }
  }
  // Presales, Engineer and Admin can access all sales (read-only)

  // Get campaigns for this sales with master campaign info
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      master_campaigns:campaign_id(id, name, description),
      users:sales_id(nama_lengkap)
    `)
    .eq("sales_id", salesId)
    .order("created_at", { ascending: false });

  // Get activities data for each campaign to calculate statistics
  const campaignsWithStats = await Promise.all(
    (campaigns || []).map(async (campaign: any) => {
      const { data: activities } = await supabase
        .from("campaign_activities")
        .select("customer_id, potential_value, jenis_aktivitas")
        .eq("campaign_id", campaign.id);

      // Calculate potential leads (unique customers)
      const uniqueCustomers = new Set(
        (activities || []).map((act: any) => act.customer_id).filter(Boolean)
      );
      const potentialLeads = uniqueCustomers.size;

      // Calculate achievement revenue (sum of closing activities)
      const achievementRevenue = (activities || [])
        .filter((act: any) => act.jenis_aktivitas === "Closing")
        .reduce((sum: number, act: any) => sum + (Number(act.potential_value) || 0), 0);

      // Calculate achievement rate
      const targetRevenue = Number(campaign.target_revenue) || 0;
      const achievementRate = targetRevenue > 0 
        ? (achievementRevenue / targetRevenue) * 100 
        : 0;

      return {
        ...campaign,
        potentialLeads,
        achievementRevenue,
        achievementRate: Math.round(achievementRate * 100) / 100,
      };
    })
  );

  return (
    <SalesDetail 
      sales={sales} 
      initialCampaigns={campaignsWithStats || []} 
      userRole={userProfile.role}
      userId={user.id}
    />
  );
}

