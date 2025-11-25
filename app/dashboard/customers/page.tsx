import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { CustomersList } from "@/components/customers/customers-list";

export default async function CustomersPage() {
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

  // Get customers based on role
  let query = supabase.from("customers").select("*, users:sales_id(nama_lengkap, role, gm_id)");

  if (userProfile?.role === "Sales") {
    query = query.eq("sales_id", user.id);
  } else if (userProfile?.role === "GM" || userProfile?.role === "GM Non Sales") {
    // Get sales under this GM
    const { data: subordinates } = await supabase
      .from("users")
      .select("id")
      .eq("gm_id", user.id);
    
    const subordinateIds = subordinates?.map(s => s.id) || [];
    query = query.in("sales_id", subordinateIds.length > 0 ? subordinateIds : [""]);
  } else if (userProfile?.role === "Presales" || userProfile?.role === "Engineer") {
    // Presales and Engineer can see all customers (read-only)
    // No filter needed
  }

  const { data: customers } = await query.order("created_at", { ascending: false });

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Customer</h1>
        <p className="text-slate-400 mt-2">Kelola prospek penjualan Anda</p>
      </div>

      <CustomersList initialCustomers={customers || []} userRole={userProfile?.role} userId={user.id} />
    </div>
  );
}
