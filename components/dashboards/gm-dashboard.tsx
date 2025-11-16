"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type TeamMember = {
  id: string;
  nama_lengkap: string;
};

type TeamSummary = {
  salesId: string;
  salesName: string;
  targetRevenue: number;
  actualRevenue: number;
  closingCount: number;
};

export function GMDashboard({ userId }: { userId: string }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [summaries, setSummaries] = useState<TeamSummary[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const yearOptions = useMemo(() => {
    const base = currentYear;
    return [base - 2, base - 1, base, base + 1, base + 2];
  }, [currentYear]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array.from({ length: 12 }, () => 0));

  useEffect(() => {
    const loadData = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();

      // Load team members (Sales under this GM)
      const { data: teamUsers } = await supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("role", "Sales")
        .eq("gm_id", userId);
      setTeam(teamUsers || []);

      // Prepare closing type id
      let closingTypeId: string | null = null;
      {
        const { data: closingType } = await supabase
          .from("activity_types")
          .select("id")
          .eq("nama_aktivitas", "Closing")
          .single();
        closingTypeId = closingType?.id || null;
      }

      // For each sales, get target for currentYear and compute actual revenue from closings
      const teamSummaries: TeamSummary[] = [];
      for (const member of teamUsers || []) {
        const { data: targetRow } = await supabase
          .from("targets")
          .select("id, target_nilai_revenue, sales_id, periode_tahun")
          .eq("sales_id", member.id)
          .eq("periode_tahun", selectedYear)
          .maybeSingle();

        let actualRevenue = 0;
        let closingCount = 0;
        if (closingTypeId) {
          const startDate = `${selectedYear}-01-01`;
          const endDate = `${selectedYear}-12-31`;
          const { data: closingActivities } = await supabase
            .from("activities")
            .select("id, customers:customer_id(nilai_potensial)")
            .eq("sales_id", member.id)
            .eq("jenis_aktivitas_id", closingTypeId)
            .eq("status_aktivitas", "Selesai")
            .gte("tanggal_aktivitas", startDate)
            .lte("tanggal_aktivitas", endDate);
          closingCount = closingActivities?.length || 0;
          actualRevenue = (closingActivities || []).reduce((sum: number, row: any) => {
            return sum + (row.customers?.nilai_potensial ? Number(row.customers.nilai_potensial) : 0);
          }, 0);
        }

        teamSummaries.push({
          salesId: member.id,
          salesName: member.nama_lengkap,
          targetRevenue: Number(targetRow?.target_nilai_revenue || 0),
          actualRevenue,
          closingCount,
        });
      }
      setSummaries(teamSummaries);

      // Load recent activities from the team (last 10)
      const { data: recent } = await supabase
        .from("activities")
        .select(`
          id,
          tanggal_aktivitas,
          status_aktivitas,
          activity_types:jenis_aktivitas_id(nama_aktivitas),
          customers:customer_id(nama_perusahaan),
          users:sales_id(nama_lengkap)
        `)
        .in("sales_id", (teamUsers || []).map(u => u.id))
        .order("tanggal_aktivitas", { ascending: false })
        .limit(10);
      setRecentActivities(recent || []);

      // Build monthly revenue across the team based on closing activities in selectedYear
      if (closingTypeId && (teamUsers || []).length > 0) {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;
        const { data: teamClosings } = await supabase
          .from("activities")
          .select("tanggal_aktivitas, customers:customer_id(nilai_potensial)")
          .in("sales_id", (teamUsers || []).map(u => u.id))
          .eq("jenis_aktivitas_id", closingTypeId)
          .eq("status_aktivitas", "Selesai")
          .gte("tanggal_aktivitas", startDate)
          .lte("tanggal_aktivitas", endDate);
        const monthly = Array.from({ length: 12 }, () => 0);
        for (const row of teamClosings || []) {
          const d = new Date(row.tanggal_aktivitas);
          const m = d.getMonth(); // 0..11
          monthly[m] += row.customers?.nilai_potensial ? Number(row.customers.nilai_potensial) : 0;
        }
        setMonthlyRevenue(monthly);
      } else {
        setMonthlyRevenue(Array.from({ length: 12 }, () => 0));
      }
    };

    loadData();
  }, [userId, selectedYear, currentYear]);

  const filteredSummaries = summaries.filter((s) =>
    s.salesName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-50">Performa Tim ({team.length} Sales)</CardTitle>
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
          <CardDescription className="text-slate-400">
            Monitoring performa penjualan tim Anda di tahun {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cari sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-50"
            />
          </div>

          {filteredSummaries.length === 0 ? (
            <p className="text-slate-400">Tidak ada data performa ditemukan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSummaries.map((s) => {
                const percent = s.targetRevenue > 0 ? Math.min((s.actualRevenue / s.targetRevenue) * 100, 100) : 0;
                return (
                  <div key={s.salesId} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-50">{s.salesName}</h3>
                      <span className="text-slate-400 text-sm">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="bg-slate-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
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
                      className="w-full bg-emerald-500 rounded-t"
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
          <CardTitle className="text-slate-50">Aktivitas Terbaru Tim</CardTitle>
          <CardDescription className="text-slate-400">10 aktivitas terbaru dari tim Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-slate-400">Belum ada aktivitas.</p>
          ) : (
            recentActivities.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-slate-700 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-50 text-sm">
                      {(a.activity_types as any)?.nama_aktivitas} • {(a.customers as any)?.nama_perusahaan}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(a.tanggal_aktivitas).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs">
                    {(a.users as any)?.nama_lengkap} • {a.status_aktivitas}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
