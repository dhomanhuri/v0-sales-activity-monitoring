import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user profile with role
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // If user profile doesn't exist, redirect to login
  if (!userProfile) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <Sidebar user={userProfile} />
      <div className="flex-1 flex flex-col">
        <TopNav user={userProfile} />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-orange-50/50 via-white to-orange-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}

