import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { MasterCustomersList } from "@/components/master-customers/master-customers-list";

export default async function MasterCustomersPage() {
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

  // Get customers based on role
  let customersQuery = supabase
    .from("master_customers")
    .select(`
      *,
      sales:sales_id(id, nama_lengkap)
    `);

  if (userProfile.role === "Sales") {
    // Sales can only see their own customers
    customersQuery = customersQuery.eq("sales_id", user.id);
  } else if (userProfile.role === "GM" || userProfile.role === "GM Non Sales") {
    // GM can see their team's customers
    const { data: teamSales } = await supabase
      .from("users")
      .select("id")
      .eq("role", "Sales")
      .eq("gm_id", user.id);
    
    const teamSalesIds = teamSales?.map(s => s.id) || [];
    if (teamSalesIds.length > 0) {
      customersQuery = customersQuery.in("sales_id", teamSalesIds);
    } else {
      customersQuery = customersQuery.eq("sales_id", "no-sales");
    }
  }
  // Admin, Editor, Presales, and Engineer can see all customers

  const { data: customers, error: customersError } = await customersQuery
    .order("created_at", { ascending: false });

  if (customersError) {
    console.error("Error loading customers:", customersError);
  }

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Master Customer</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage master customer data</p>
      </div>

      <MasterCustomersList 
        initialCustomers={customers || []} 
        userRole={userProfile.role}
        userId={user.id}
      />
    </div>
  );
}

