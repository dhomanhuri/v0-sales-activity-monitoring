"use client";

import Image from "next/image";
import { User } from 'lucide-react';
import Link from "next/link";

export function TopNav({ user }: { user: any }) {
  const avatarUrl = user?.avatar_url;

  return (
    <div className="bg-gradient-to-r from-orange-50/90 via-white/90 to-orange-50/90 dark:from-slate-800/90 dark:via-slate-800/90 dark:to-slate-800/90 backdrop-blur-md border-b border-orange-200/50 dark:border-slate-700/50 px-6 py-4 flex items-center justify-between shadow-md shadow-orange-100/20 dark:shadow-slate-900/50">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-orange-200 dark:border-orange-600/50 shadow-lg ring-2 ring-orange-100/50 dark:ring-orange-900/30">
            <Image
              src={avatarUrl}
              alt={user?.nama_lengkap || "User avatar"}
              width={48}
              height={48}
              className="object-cover h-full w-full"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-orange-200/50 dark:ring-orange-800/50">
            <span className="text-white font-bold text-base">
              {user?.nama_lengkap?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Welcome back,</p>
          <p className="text-base font-bold text-slate-900 dark:text-slate-50">{user?.nama_lengkap}</p>
        </div>
      </div>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-100 to-orange-200 dark:from-slate-700 dark:to-slate-700 hover:from-orange-200 hover:to-orange-300 dark:hover:from-slate-600 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 hover:text-orange-700 dark:hover:text-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 border border-orange-200/50 dark:border-slate-600/50"
      >
        <User className="h-4 w-4" />
        <span className="font-semibold">Profile</span>
      </Link>
    </div>
  );
}
