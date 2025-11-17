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

  // Only Admin can access
  if (!userProfile || userProfile.role !== "Admin") {
    redirect("/dashboard");
  }

  const { data: customers, error: customersError } = await supabase
    .from("master_customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (customersError) {
    console.error("Error loading customers:", customersError);
  }

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Master Customer</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Kelola data master customer</p>
      </div>

      <MasterCustomersList initialCustomers={customers || []} />
    </div>
  );
}

