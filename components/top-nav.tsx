"use client";

import Image from "next/image";
import { User } from 'lucide-react';
import Link from "next/link";

export function TopNav({ user }: { user: any }) {
  const avatarUrl = user?.avatar_url;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 shadow-md">
            <Image
              src={avatarUrl}
              alt={user?.nama_lengkap || "User avatar"}
              width={40}
              height={40}
              className="object-cover h-full w-full"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">
              {user?.nama_lengkap?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome back,</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{user?.nama_lengkap}</p>
        </div>
      </div>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 dark:from-slate-700 dark:to-slate-700 hover:from-orange-100 hover:to-orange-200 dark:hover:from-slate-600 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 hover:text-orange-700 dark:hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <User className="h-4 w-4" />
        <span className="font-medium">Profile</span>
      </Link>
    </div>
  );
}
