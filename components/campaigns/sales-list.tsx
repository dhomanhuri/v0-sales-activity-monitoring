"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SalesList({ initialSales }: { initialSales: any[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredSales = initialSales.filter((sales) => {
    const matchesSearch =
      sales.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
      sales.email?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Cari sales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
          />
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          {filteredSales.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">Tidak ada sales ditemukan</p>
          ) : (
            <div className="space-y-2">
              {filteredSales.map((sales) => (
                <div
                  key={sales.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/campaigns/sales/${sales.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">
                        {sales.nama_lengkap}
                      </h3>
                      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>{sales.email}</span>
                        <span>Role: {sales.role}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/campaigns/sales/${sales.id}`);
                        }}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

