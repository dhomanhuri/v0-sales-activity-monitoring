import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { UsersList } from "@/components/users/users-list";

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/auth/login");
  }

  // Check if user is Admin
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userProfile?.role !== "Admin") {
    redirect("/dashboard");
  }

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">User Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage all system users</p>
      </div>

      <UsersList initialUsers={users || []} />
    </div>
  );
}
