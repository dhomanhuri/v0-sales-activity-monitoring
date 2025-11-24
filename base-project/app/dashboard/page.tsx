import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
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

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">📊</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">
              Welcome back, {userProfile.nama_lengkap}
            </p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-50">Welcome</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              This is a minimal base project with login and user management features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Role:</strong> {userProfile.role === 'Sales' ? 'AM' : userProfile.role}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Email:</strong> {userProfile.email}
                </p>
              </div>
              {userProfile.role === 'Admin' && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    As an Admin, you can manage users from the User Management menu.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

