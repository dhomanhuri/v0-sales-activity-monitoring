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
            placeholder="Search sales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
          />
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="pt-6">
          {filteredSales.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-12">No sales found</p>
          ) : (
            <div className="space-y-3">
              {filteredSales.map((sales) => (
                <div
                  key={sales.id}
                  className="p-5 rounded-xl bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-700 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] cursor-pointer"
                  onClick={() => router.push(`/dashboard/campaigns/sales/${sales.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">
                          {sales.nama_lengkap?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-1">
                          {sales.nama_lengkap}
                        </h3>
                        <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span>{sales.email}</span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium">Role: {sales.role}</span>
                        </div>
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

