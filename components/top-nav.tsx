"use client";

import { User } from 'lucide-react';
import Link from "next/link";

export function TopNav({ user }: { user: any }) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <span>Welcome,</span>
        <span className="font-semibold text-orange-600 dark:text-orange-400">{user?.nama_lengkap}</span>
      </div>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-white transition-colors"
      >
        <User className="h-5 w-5" />
        Profile
      </Link>
    </div>
  );
}
