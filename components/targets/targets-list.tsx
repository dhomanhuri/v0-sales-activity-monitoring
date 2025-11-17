"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

export function TargetsList({ initialTargets, userRole, userId }: any) {
  const [targets] = useState(initialTargets);
  const [search, setSearch] = useState("");

  const filteredTargets = targets.filter((target: any) => {
    const matchesSearch =
      target.sales_name?.toLowerCase().includes(search.toLowerCase());
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
          {filteredTargets.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">Tidak ada data ditemukan</p>
          ) : (
            <div className="space-y-4">
              {filteredTargets.map((target: any) => {
                const targetRevenue = Number(target.target_revenue || 0);
                const potentialRevenue = Number(target.potential_revenue || 0);
                const achievementRevenue = Number(target.achievement_revenue || 0);
                const progressPercent = targetRevenue > 0 ? (achievementRevenue / targetRevenue * 100) : 0;

                return (
                  <div
                    key={target.sales_id}
                    className="p-6 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-50 mb-1">
                        {target.sales_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Summary dari semua campaign
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Target Revenue</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          Rp {targetRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Potential Revenue</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          Rp {potentialRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Achievement Revenue</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          Rp {achievementRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{progressPercent.toFixed(1)}%</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
