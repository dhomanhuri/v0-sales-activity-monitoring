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

  // Get sales list based on role
  let salesQuery = supabase
    .from("users")
    .select("id, nama_lengkap, email, role")
    .eq("role", "Sales");

  if (userProfile.role === "Sales") {
    // Sales hanya melihat dirinya sendiri
    salesQuery = salesQuery.eq("id", user.id);
  } else if (userProfile.role === "GM") {
    // GM melihat sales di bawahnya
    salesQuery = salesQuery.eq("gm_id", user.id);
  }
  // Admin melihat semua sales

  const { data: sales } = await salesQuery.order("nama_lengkap", { ascending: true });

  return (
    <div className="p-6 md:p-8 min-h-screen space-y-6">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">📋</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">AM</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">Select sales to view and manage campaigns</p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SalesList initialSales={sales || []} />
      </div>
    </div>
  );
}

