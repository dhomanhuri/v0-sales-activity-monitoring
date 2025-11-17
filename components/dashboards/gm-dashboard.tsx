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
  potentialRevenue: number;
  achievementRevenue: number;
  campaignCount: number;
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

      // For each sales, calculate from campaigns
      const teamSummaries: TeamSummary[] = [];
      for (const member of teamUsers || []) {
        // Get all campaigns for this sales
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, target_revenue")
          .eq("sales_id", member.id);

        // Calculate Target Revenue (sum of all campaign.target_revenue)
        const targetRevenue = (campaigns || []).reduce((sum: number, camp: any) => {
          return sum + (Number(camp.target_revenue) || 0);
        }, 0);

        // Calculate Potential Revenue (akumulasi potential value terakhir tiap customer per campaign)
        let potentialRevenue = 0;
        for (const campaign of campaigns || []) {
          const { data: activities } = await supabase
            .from("campaign_activities")
            .select("customer_id, potential_value, tanggal_aktivitas, created_at")
            .eq("campaign_id", campaign.id)
            .order("tanggal_aktivitas", { ascending: false });
          
          if (activities && activities.length > 0) {
            // Group by customer_id, keep only latest activity per customer
            const customerLatestActivity = new Map<string, any>();
            
            for (const activity of activities) {
              const customerId = activity.customer_id;
              if (customerId && !customerLatestActivity.has(customerId)) {
                customerLatestActivity.set(customerId, activity);
              }
            }
            
            // Sum potential_value from latest activities per customer
            for (const activity of customerLatestActivity.values()) {
              potentialRevenue += Number(activity.potential_value) || 0;
            }
          }
        }

        // Calculate Achievement Revenue (sum of all Closing activities)
        let achievementRevenue = 0;
        for (const campaign of campaigns || []) {
          const { data: closingActivities } = await supabase
            .from("campaign_activities")
            .select("potential_value")
            .eq("campaign_id", campaign.id)
            .eq("jenis_aktivitas", "Closing");
          
          achievementRevenue += (closingActivities || []).reduce((sum: number, act: any) => {
            return sum + (Number(act.potential_value) || 0);
          }, 0);
        }

        teamSummaries.push({
          salesId: member.id,
          salesName: member.nama_lengkap,
          targetRevenue,
          potentialRevenue,
          achievementRevenue,
          campaignCount: campaigns?.length || 0,
        });
      }
      setSummaries(teamSummaries);

      // Load recent activities from campaign_activities (last 10)
      const teamIds = (teamUsers || []).map(u => u.id);
      if (teamIds.length > 0) {
        // First get campaigns for team
        const { data: teamCampaigns } = await supabase
          .from("campaigns")
          .select("id")
          .in("sales_id", teamIds);
        
        const campaignIds = (teamCampaigns || []).map(c => c.id);
        
        if (campaignIds.length > 0) {
          const { data: recent } = await supabase
            .from("campaign_activities")
            .select(`
              id,
              jenis_aktivitas,
              keterangan,
              tanggal_aktivitas,
              potential_value,
              campaign_id,
              campaigns:campaign_id(
                master_customers:customer_id(name),
                master_campaigns:campaign_id(name),
                users:sales_id(nama_lengkap)
              )
            `)
            .in("campaign_id", campaignIds)
            .order("tanggal_aktivitas", { ascending: false })
            .limit(10);
          setRecentActivities(recent || []);
        }
      }

      // Build monthly revenue from Closing activities in selectedYear
      if ((teamUsers || []).length > 0) {
        const teamIds = (teamUsers || []).map(u => u.id);
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id")
          .in("sales_id", teamIds);
        
        const campaignIds = (campaigns || []).map(c => c.id);
        if (campaignIds.length > 0) {
          const startDate = `${selectedYear}-01-01`;
          const endDate = `${selectedYear}-12-31`;
          const { data: closings } = await supabase
            .from("campaign_activities")
            .select("tanggal_aktivitas, potential_value")
            .in("campaign_id", campaignIds)
            .eq("jenis_aktivitas", "Closing")
            .gte("tanggal_aktivitas", startDate)
            .lte("tanggal_aktivitas", endDate);
          
          const monthly = Array.from({ length: 12 }, () => 0);
          for (const row of closings || []) {
            const d = new Date(row.tanggal_aktivitas);
            const m = d.getMonth();
            monthly[m] += Number(row.potential_value) || 0;
          }
          setMonthlyRevenue(monthly);
        } else {
          setMonthlyRevenue(Array.from({ length: 12 }, () => 0));
        }
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
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-900 dark:text-slate-50">Performa Tim ({team.length} Sales)</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">Tahun</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Monitoring performa penjualan tim Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 dark:text-slate-400" />
            <Input
              placeholder="Cari sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
            />
          </div>

          {filteredSummaries.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">Tidak ada data performa ditemukan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSummaries.map((s) => {
                const percent = s.targetRevenue > 0 ? Math.min((s.achievementRevenue / s.targetRevenue) * 100, 100) : 0;
                return (
                  <div key={s.salesId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{s.salesName}</h3>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Target</div>
                        <div className="text-slate-900 dark:text-slate-50 font-semibold">Rp {s.targetRevenue.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Potential</div>
                        <div className="text-blue-400 font-semibold">Rp {s.potentialRevenue.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Achievement</div>
                        <div className="text-green-400 font-semibold">Rp {s.achievementRevenue.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="bg-slate-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Campaign: {s.campaignCount}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Revenue Bulanan (Closing)</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Distribusi revenue per bulan di {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.every(v => v === 0) ? (
            <p className="text-slate-600 dark:text-slate-400">Belum ada revenue pada tahun ini.</p>
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
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">{idx + 1}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Aktivitas Terbaru Tim</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">10 aktivitas terbaru dari tim Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">Belum ada aktivitas.</p>
          ) : (
            recentActivities.map((a) => {
              const campaign = (a.campaigns as any);
              return (
                <div key={a.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-900 dark:text-slate-50 text-sm">
                        {a.jenis_aktivitas} • {campaign?.master_customers?.name} - {campaign?.master_campaigns?.name}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-xs">
                        {new Date(a.tanggal_aktivitas).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">
                      {campaign?.users?.nama_lengkap}
                      {a.potential_value && ` • Rp ${Number(a.potential_value).toLocaleString('id-ID')}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
