import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from 'next/navigation';
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  // Get campaign with relations
  const { data: campaign } = await supabase
    .from("campaigns")
    .select(`
      *,
      master_campaigns:campaign_id(name, description),
      users:sales_id(nama_lengkap)
    `)
    .eq("id", id)
    .single();

  if (!campaign) {
    notFound();
  }

  // Check access
  if (userProfile.role === "Sales" && campaign.sales_id !== user.id) {
    redirect("/dashboard/campaigns");
  } else if (userProfile.role === "GM") {
    const { data: salesUser } = await supabase
      .from("users")
      .select("gm_id")
      .eq("id", campaign.sales_id)
      .single();
    
    if (salesUser?.gm_id !== user.id) {
      redirect("/dashboard/campaigns");
    }
  }
  // Presales and Admin can access all campaigns (read-only)

  // Get campaign activities with customer
  const { data: activities } = await supabase
    .from("campaign_activities")
    .select(`
      *,
      master_customers:customer_id(name)
    `)
    .eq("campaign_id", id)
    .order("tanggal_aktivitas", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <CampaignDetail 
      campaign={campaign} 
      activities={activities || []} 
      userRole={userProfile.role}
      userId={user.id}
    />
  );
}

