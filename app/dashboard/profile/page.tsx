import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { ProfileSettings } from "@/components/profile/profile-settings";

export default async function ProfilePage() {
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

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Profile Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your profile and account settings</p>
      </div>

      <ProfileSettings user={userProfile} userEmail={user.email} />
    </div>
  );
}
