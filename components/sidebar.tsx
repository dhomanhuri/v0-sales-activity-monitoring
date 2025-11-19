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
  { label: "Profile Settings", href: "/dashboard/profile", icon: Settings },
];

const adminMenuItems = [
  { label: "User Management", href: "/dashboard/users", icon: Users },
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
    <div className="w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-lg">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-orange-50/50 to-white dark:from-slate-800 dark:to-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 p-3 shadow-lg transform hover:scale-105 transition-transform duration-200">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight">Campaign Tracker</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === "/dashboard/campaigns" && pathname?.startsWith("/dashboard/campaigns"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 transform scale-[1.02]"
                  : "text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-700 dark:hover:to-slate-700 hover:text-orange-600 dark:hover:text-white hover:shadow-md hover:scale-[1.01]"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              {item.label}
            </Link>
          );
        })}

        {user?.role === "Admin" && (
          <>
            <div className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4">
              Admin
            </div>
            {adminMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 transform scale-[1.02]"
                      : "text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-700 dark:hover:to-slate-700 hover:text-orange-600 dark:hover:text-white hover:shadow-md hover:scale-[1.01]"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3 bg-gradient-to-t from-slate-50/50 to-transparent dark:from-slate-800 dark:to-transparent">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-slate-700 dark:hover:to-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
