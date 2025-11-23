"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Eye, TrendingUp, Target, Users, DollarSign, Filter, X, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SalesList({ initialSales }: { initialSales: any[] }) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [achievementFilter, setAchievementFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const router = useRouter();

  // Get unique departments for filter
  const departments = Array.from(
    new Set(
      initialSales
        .map((s) => (s.gm as any)?.department)
        .filter(Boolean)
    )
  ).sort();

  const filteredAndSortedSales = useMemo(() => {
    // Filter first
    let filtered = initialSales.filter((sales) => {
      const matchesSearch =
        sales.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
        sales.email?.toLowerCase().includes(search.toLowerCase()) ||
        ((sales.gm as any)?.department || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesDepartment = !departmentFilter || (sales.gm as any)?.department === departmentFilter;
      
      const achievementRate = sales.achievementRate || 0;
      const matchesAchievement = !achievementFilter || 
        (achievementFilter === "excellent" && achievementRate >= 100) ||
        (achievementFilter === "good" && achievementRate >= 50 && achievementRate < 100) ||
        (achievementFilter === "needs-improvement" && achievementRate < 50);
      
      return matchesSearch && matchesDepartment && matchesAchievement;
    });

    // Sort
    const [sortField, sortOrder] = sortBy.split("-");
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "");
          break;
        case "department":
          const deptA = (a.gm as any)?.department || "";
          const deptB = (b.gm as any)?.department || "";
          comparison = deptA.localeCompare(deptB);
          break;
        case "target":
          comparison = (a.targetRevenue || 0) - (b.targetRevenue || 0);
          break;
        case "achievement":
          comparison = (a.achievementRate || 0) - (b.achievementRate || 0);
          break;
        case "leads":
          comparison = (a.potentialLeads || 0) - (b.potentialLeads || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [initialSales, search, departmentFilter, achievementFilter, sortBy]);

  const hasActiveFilters = departmentFilter || achievementFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <Input
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-slate-200 dark:border-slate-600 ${hasActiveFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                {[departmentFilter, achievementFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50"
          >
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="department-asc">Sort: Department (A-Z)</option>
            <option value="department-desc">Sort: Department (Z-A)</option>
            <option value="target-desc">Sort: Target Revenue (High-Low)</option>
            <option value="target-asc">Sort: Target Revenue (Low-High)</option>
            <option value="achievement-desc">Sort: Achievement Rate (High-Low)</option>
            <option value="achievement-asc">Sort: Achievement Rate (Low-High)</option>
            <option value="leads-desc">Sort: Potential Leads (High-Low)</option>
            <option value="leads-asc">Sort: Potential Leads (Low-High)</option>
          </select>
        </div>

        {showFilters && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Achievement Rate
                  </label>
                  <select
                    value={achievementFilter}
                    onChange={(e) => setAchievementFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
                  >
                    <option value="">All Rates</option>
                    <option value="excellent">Excellent (≥100%)</option>
                    <option value="good">Good (50-99%)</option>
                    <option value="needs-improvement">Needs Improvement (&lt;50%)</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDepartmentFilter("");
                      setAchievementFilter("");
                    }}
                    className="border-red-200 dark:border-red-600 text-red-600 dark:text-red-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredAndSortedSales.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600 dark:text-slate-400 py-12">No AM found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSales.map((sales) => {
            const gm = sales.gm as any;
            const department = gm?.department || "-";
            const achievementRate = sales.achievementRate || 0;
            const achievementColor = achievementRate >= 100 
              ? "text-green-600 dark:text-green-400" 
              : achievementRate >= 50 
              ? "text-yellow-600 dark:text-yellow-400" 
              : "text-red-600 dark:text-red-400";

            return (
              <Card
                key={sales.id}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                onClick={() => router.push(`/dashboard/campaigns/sales/${sales.id}`)}
              >
                <CardContent className="p-6">
                  {/* Header with Avatar and Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 border-2 border-slate-200 dark:border-slate-600">
                      <AvatarImage src={sales.avatar_url} alt={sales.nama_lengkap} />
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                        {sales.nama_lengkap
                          ? sales.nama_lengkap
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-1 truncate">
                        {sales.nama_lengkap}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {sales.email}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/campaigns/sales/${sales.id}`);
                      }}
                      className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Department */}
                  <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Department:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {department}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Target Revenue */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Target className="h-3 w-3" />
                        <span>Target Revenue</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        Rp {sales.targetRevenue?.toLocaleString('id-ID') || '0'}
                      </p>
                    </div>

                    {/* Potential Leads */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Users className="h-3 w-3" />
                        <span>Potential Leads</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        {sales.potentialLeads || 0}
                      </p>
                    </div>

                    {/* Achievement Revenue */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <DollarSign className="h-3 w-3" />
                        <span>Achievement Revenue</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        Rp {sales.achievementRevenue?.toLocaleString('id-ID') || '0'}
                      </p>
                    </div>

                    {/* Achievement Rate */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <TrendingUp className="h-3 w-3" />
                        <span>Achievement Rate</span>
                      </div>
                      <p className={`font-semibold ${achievementColor}`}>
                        {achievementRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className={`font-medium ${achievementColor}`}>
                        {achievementRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          achievementRate >= 100
                            ? "bg-green-500"
                            : achievementRate >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(achievementRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

