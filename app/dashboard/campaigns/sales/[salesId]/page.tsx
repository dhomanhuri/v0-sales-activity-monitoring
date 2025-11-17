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

  // Get campaigns for this sales
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      master_campaigns:campaign_id(name),
      users:sales_id(nama_lengkap)
    `)
    .eq("sales_id", salesId)
    .order("created_at", { ascending: false });

  return (
    <SalesDetail 
      sales={sales} 
      initialCampaigns={campaigns || []} 
      userRole={userProfile.role}
      userId={user.id}
    />
  );
}

