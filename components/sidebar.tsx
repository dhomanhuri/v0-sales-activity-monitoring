"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Activity, Target, Settings, LogOut, Building2, Megaphone } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AM", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Target", href: "/dashboard/targets", icon: Target },
  { label: "Pengaturan Profil", href: "/dashboard/profile", icon: Settings },
];

const adminMenuItems = [
  { label: "Manajemen User", href: "/dashboard/users", icon: Users },
  { label: "Master Customer", href: "/dashboard/master-customers", icon: Building2 },
  { label: "Master Campaign", href: "/dashboard/master-campaigns", icon: Megaphone },
];

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 p-2">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Campaign Monitoring</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === "/dashboard/campaigns" && pathname?.startsWith("/dashboard/campaigns"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md"
                  : "text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {user?.role === "Admin" && (
          <>
            <div className="py-2 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Admin
            </div>
            {adminMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
