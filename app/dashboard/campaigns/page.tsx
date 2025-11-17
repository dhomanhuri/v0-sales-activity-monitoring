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
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Campaign</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Pilih sales untuk melihat dan mengelola campaign</p>
      </div>

      <SalesList initialSales={sales || []} />
    </div>
  );
}

