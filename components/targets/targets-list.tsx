"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

export function TargetsList({ initialTargets, userRole, userId }: any) {
  const [targets] = useState(initialTargets);
  const [search, setSearch] = useState("");
  const isPresales = userRole === "Presales" || userRole === "Engineer";

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
            placeholder="Search AM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
          />
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          {filteredTargets.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">No data found</p>
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
                    className="p-6 rounded-xl bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    <div className="mb-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">
                            {target.sales_name?.charAt(0)?.toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-900 dark:text-slate-50">
                            {target.sales_name}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Summary from all campaigns
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 gap-4 mb-5 ${isPresales ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-700 border border-slate-200 dark:border-slate-600">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold uppercase tracking-wider">Target Revenue</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                          Rp {targetRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white dark:from-slate-700 dark:to-slate-700 border border-blue-200 dark:border-blue-600">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-semibold uppercase tracking-wider">Potential Leads Revenue</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          Rp {potentialRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                      {!isPresales && (
                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-white dark:from-slate-700 dark:to-slate-700 border border-green-200 dark:border-green-600">
                          <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-semibold uppercase tracking-wider">Achievement Revenue</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            Rp {achievementRevenue.toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>

                    {!isPresales && (
                      <div>
                        <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300 mb-2 font-medium">
                          <span>Progress</span>
                          <span className="font-bold">{progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
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
