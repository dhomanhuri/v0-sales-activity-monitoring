"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SalesSummary = {
  salesId: string;
  salesName: string;
  targetRevenue: number;
  actualRevenue: number;
  closingCount: number;
};

export function AdminDashboard() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const yearOptions = useMemo(() => {
    const base = currentYear;
    return [base - 2, base - 1, base, base + 1, base + 2];
  }, [currentYear]);

  const [kpis, setKpis] = useState({
    totalSales: 0,
    totalGm: 0,
    totalCustomers: 0,
    activitiesThisYear: 0,
    totalTargetRevenue: 0,
    totalActualRevenue: 0,
  });
  const [topSales, setTopSales] = useState<SalesSummary[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();

      // Basic counts
      const [{ data: salesUsers }, { data: gmUsers }] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: false }).eq("role", "Sales"),
        supabase.from("users").select("id", { count: "exact", head: false }).eq("role", "GM"),
      ]);
      const totalSales = salesUsers?.length || 0;
      const totalGm = gmUsers?.length || 0;

      const [{ data: customers }, { data: activitiesYear }] = await Promise.all([
        supabase.from("customers").select("id"),
        supabase
          .from("activities")
          .select("id")
          .gte("tanggal_aktivitas", `${selectedYear}-01-01`)
          .lte("tanggal_aktivitas", `${selectedYear}-12-31`),
      ]);
      const totalCustomers = customers?.length || 0;
      const activitiesThisYear = activitiesYear?.length || 0;

      // Closing type id
      let closingTypeId: string | null = null;
      {
        const { data: closingType } = await supabase
          .from("activity_types")
          .select("id")
          .eq("nama_aktivitas", "Closing")
          .single();
        closingTypeId = closingType?.id || null;
      }

      // Targets across org for selected year
      const { data: targets } = await supabase
        .from("targets")
        .select("id, sales_id, target_nilai_revenue, periode_tahun, users:sales_id(nama_lengkap)")
        .eq("periode_tahun", selectedYear);
      const totalTargetRevenue = (targets || []).reduce(
        (sum: number, t: any) => sum + (t.target_nilai_revenue ? Number(t.target_nilai_revenue) : 0),
        0
      );

      // Actual revenue across org (sum of customers.nilai_potensial from closing selesai)
      let totalActualRevenue = 0;
      const salesSummaries: SalesSummary[] = [];
      if (closingTypeId) {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;

        // Build map salesId -> { name, target }
        const salesMap = new Map<string, { name: string; target: number }>();
        for (const t of targets || []) {
          salesMap.set(t.sales_id, {
            name: (t.users as any)?.nama_lengkap || "Sales",
            target: Number(t.target_nilai_revenue || 0),
          });
        }

        // Get all closing activities for year
        const { data: closings } = await supabase
          .from("activities")
          .select("sales_id, tanggal_aktivitas, customers:customer_id(nilai_potensial)")
          .eq("jenis_aktivitas_id", closingTypeId)
          .eq("status_aktivitas", "Selesai")
          .gte("tanggal_aktivitas", startDate)
          .lte("tanggal_aktivitas", endDate);

        // Aggregate totals by sales and by month
        const monthly = Array.from({ length: 12 }, () => 0);
        const bySales = new Map<string, { actual: number; count: number }>();
        for (const row of closings || []) {
          const value = row.customers?.nilai_potensial ? Number(row.customers.nilai_potensial) : 0;
          totalActualRevenue += value;
          const d = new Date(row.tanggal_aktivitas);
          monthly[d.getMonth()] += value;
          const prev = bySales.get(row.sales_id) || { actual: 0, count: 0 };
          bySales.set(row.sales_id, { actual: prev.actual + value, count: prev.count + 1 });
        }
        setMonthlyRevenue(monthly);

        // Build sales summaries (include those with targets even if actual 0)
        for (const [salesId, info] of salesMap.entries()) {
          const agg = bySales.get(salesId) || { actual: 0, count: 0 };
          salesSummaries.push({
            salesId,
            salesName: info.name,
            targetRevenue: info.target,
            actualRevenue: agg.actual,
            closingCount: agg.count,
          });
        }
      } else {
        setMonthlyRevenue(Array.from({ length: 12 }, () => 0));
      }
      // Sort top sales by actual revenue desc, take top 8
      salesSummaries.sort((a, b) => b.actualRevenue - a.actualRevenue);
      setTopSales(salesSummaries.slice(0, 8));

      setKpis({
        totalSales,
        totalGm,
        totalCustomers,
        activitiesThisYear,
        totalTargetRevenue,
        totalActualRevenue,
      });
    };

    loadData();
  }, [selectedYear, currentYear]);

  const filteredTopSales = topSales.filter((s) =>
    s.salesName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-50">Overview Sistem</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Tahun</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-50"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <CardDescription className="text-slate-400">Ringkasan keseluruhan sistem penjualan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1">Total Sales</div>
              <div className="text-slate-50 text-2xl font-semibold">{kpis.totalSales}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1">Total GM</div>
              <div className="text-slate-50 text-2xl font-semibold">{kpis.totalGm}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1">Total Customers</div>
              <div className="text-slate-50 text-2xl font-semibold">{kpis.totalCustomers}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1">Aktivitas Tahun Ini</div>
              <div className="text-slate-50 text-2xl font-semibold">{kpis.activitiesThisYear}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1">Target Revenue {selectedYear}</div>
              <div className="text-slate-50 text-2xl font-semibold">Rp {kpis.totalTargetRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1">Achievement Revenue {selectedYear}</div>
              <div className="text-slate-50 text-2xl font-semibold">Rp {kpis.totalActualRevenue.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Revenue Bulanan (Closing Selesai)</CardTitle>
          <CardDescription className="text-slate-400">Distribusi revenue per bulan di {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.every(v => v === 0) ? (
            <p className="text-slate-400">Belum ada revenue pada tahun ini.</p>
          ) : (
            <div className="grid grid-cols-12 gap-2 items-end h-40">
              {monthlyRevenue.map((value, idx) => {
                const max = Math.max(...monthlyRevenue);
                const heightPct = max > 0 ? Math.max((value / max) * 100, 4) : 4;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-500 rounded-t"
                      style={{ height: `${heightPct}%` }}
                      title={`Rp ${value.toLocaleString('id-ID')}`}
                    />
                    <div className="text-[10px] text-slate-400">{idx + 1}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 text-xs text-slate-400">
            Angka pada batang adalah bulan (1-12). Arahkan kursor untuk melihat nilai.
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-50">Top Sales by Achievement</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-slate-800 border-slate-700 text-slate-50"
              />
            </div>
          </div>
          <CardDescription className="text-slate-400">Berdasarkan revenue closing {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTopSales.length === 0 ? (
            <p className="text-slate-400">Tidak ada data.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopSales.map((s) => {
                const percent = s.targetRevenue > 0 ? Math.min((s.actualRevenue / s.targetRevenue) * 100, 100) : 0;
                return (
                  <div key={s.salesId} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-50">{s.salesName}</h3>
                      <span className="text-slate-400 text-sm">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="bg-slate-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Achievement: <span className="text-slate-50 font-semibold">Rp {s.actualRevenue.toLocaleString('id-ID')}</span></span>
                      <span>Target: <span className="text-slate-50 font-semibold">Rp {s.targetRevenue.toLocaleString('id-ID')}</span></span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Closing: {s.closingCount}</div>
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
