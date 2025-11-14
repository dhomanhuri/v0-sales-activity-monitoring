"use client";

import { User } from 'lucide-react';
import Link from "next/link";

export function TopNav({ user }: { user: any }) {
  return (
    <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span>Selamat datang,</span>
        <span className="font-semibold text-slate-50">{user?.nama_lengkap}</span>
      </div>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
      >
        <User className="h-5 w-5" />
        Profil
      </Link>
    </div>
  );
}
