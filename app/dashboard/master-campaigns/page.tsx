import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { MasterCampaignsList } from "@/components/master-campaigns/master-campaigns-list";

export default async function MasterCampaignsPage() {
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

  // Only Admin can access
  if (!userProfile || userProfile.role !== "Admin") {
    redirect("/dashboard");
  }

  const { data: campaigns } = await supabase
    .from("master_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Master Campaign</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Kelola data master campaign</p>
      </div>

      <MasterCampaignsList initialCampaigns={campaigns || []} />
    </div>
  );
}

