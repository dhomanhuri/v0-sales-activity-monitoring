"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SalesSummary = {
  salesId: string;
  salesName: string;
  targetRevenue: number;
  potentialRevenue: number;
  achievementRevenue: number;
  campaignCount: number;
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
    totalCampaigns: 0,
    totalMasterCustomers: 0,
    totalTargetRevenue: 0,
    totalPotentialRevenue: 0,
    totalAchievementRevenue: 0,
  });
  const [topSales, setTopSales] = useState<SalesSummary[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();

      // Basic counts
      const [{ data: salesUsers }, { data: gmUsers }, { data: campaigns }, { data: masterCustomers }] = await Promise.all([
        supabase.from("users").select("id, nama_lengkap").eq("role", "Sales"),
        supabase.from("users").select("id").eq("role", "GM"),
        supabase.from("campaigns").select("id"),
        supabase.from("master_customers").select("id"),
      ]);
      const totalSales = salesUsers?.length || 0;
      const totalGm = gmUsers?.length || 0;
      const totalCampaigns = campaigns?.length || 0;
      const totalMasterCustomers = masterCustomers?.length || 0;

      // Calculate totals from campaigns
      let totalTargetRevenue = 0;
      let totalPotentialRevenue = 0;
      let totalAchievementRevenue = 0;
      const monthly = Array.from({ length: 12 }, () => 0);

      // Get all campaigns
      const { data: allCampaigns } = await supabase
        .from("campaigns")
        .select("id, target_revenue");

      // Calculate target revenue
      totalTargetRevenue = (allCampaigns || []).reduce((sum: number, camp: any) => {
        return sum + (Number(camp.target_revenue) || 0);
      }, 0);

      // Get all campaign IDs
      const allCampaignIds = (allCampaigns || []).map(c => c.id);

      if (allCampaignIds.length > 0) {
        // Get all activities for potential and achievement calculation
        const { data: allActivities } = await supabase
          .from("campaign_activities")
          .select("campaign_id, customer_id, jenis_aktivitas, potential_value, tanggal_aktivitas, created_at")
          .in("campaign_id", allCampaignIds);

        // Calculate potential revenue (akumulasi potential value terakhir tiap customer per campaign)
        // Group activities by campaign_id first
        const activitiesByCampaign = new Map<string, any[]>();
        for (const act of allActivities || []) {
          const campId = act.campaign_id;
          if (!activitiesByCampaign.has(campId)) {
            activitiesByCampaign.set(campId, []);
          }
          activitiesByCampaign.get(campId)!.push(act);
        }
        
        // For each campaign, calculate potential revenue from latest activity per customer
        for (const [campaignId, activities] of activitiesByCampaign.entries()) {
          if (activities.length > 0) {
            // Sort by tanggal_aktivitas descending
            const sortedActivities = [...activities].sort((a, b) => {
              const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
              const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
              return dateB - dateA;
            });
            
            // Group by customer_id, keep only latest activity per customer
            const customerLatestActivity = new Map<string, any>();
            for (const activity of sortedActivities) {
              const customerId = activity.customer_id;
              if (customerId && !customerLatestActivity.has(customerId)) {
                customerLatestActivity.set(customerId, activity);
              }
            }
            
            // Sum potential_value from latest activities per customer
            for (const activity of customerLatestActivity.values()) {
              totalPotentialRevenue += Number(activity.potential_value) || 0;
            }
          }
        }

        // Calculate achievement revenue and monthly revenue
        for (const act of allActivities || []) {
          if (act.jenis_aktivitas === "Closing") {
            const value = Number(act.potential_value) || 0;
            totalAchievementRevenue += value;
            
            // Monthly revenue for selected year
            const d = new Date(act.tanggal_aktivitas);
            if (d.getFullYear() === selectedYear) {
              monthly[d.getMonth()] += value;
            }
          }
        }
      }

      setMonthlyRevenue(monthly);

      // Build sales summaries
      const salesSummaries: SalesSummary[] = [];
      
      // Get all campaigns with sales info
      const { data: allCampaignsWithSales } = await supabase
        .from("campaigns")
        .select("id, target_revenue, sales_id, users:sales_id(nama_lengkap)");

      // Group campaigns by sales_id
      const salesCampaignsMap = new Map<string, any[]>();
      for (const camp of allCampaignsWithSales || []) {
        const salesId = camp.sales_id;
        if (!salesCampaignsMap.has(salesId)) {
          salesCampaignsMap.set(salesId, []);
        }
        salesCampaignsMap.get(salesId)!.push(camp);
      }

      // Get all activities once
      const { data: allActivitiesForSummary } = await supabase
        .from("campaign_activities")
        .select("campaign_id, customer_id, jenis_aktivitas, potential_value, tanggal_aktivitas, created_at");

      // Group activities by campaign_id
      const activitiesByCampaign = new Map<string, any[]>();
      for (const act of allActivitiesForSummary || []) {
        const campId = act.campaign_id;
        if (!activitiesByCampaign.has(campId)) {
          activitiesByCampaign.set(campId, []);
        }
        activitiesByCampaign.get(campId)!.push(act);
      }

      // Calculate for each sales
      for (const sales of salesUsers || []) {
        const salesCampaigns = salesCampaignsMap.get(sales.id) || [];
        
        const targetRevenue = salesCampaigns.reduce((sum: number, camp: any) => {
          return sum + (Number(camp.target_revenue) || 0);
        }, 0);

        let potentialRevenue = 0;
        let achievementRevenue = 0;
        
        for (const campaign of salesCampaigns) {
          const activities = activitiesByCampaign.get(campaign.id) || [];
          
          // Potential: akumulasi potential value terakhir tiap customer
          if (activities.length > 0) {
            // Sort by tanggal_aktivitas descending
            const sortedActivities = [...activities].sort((a, b) => {
              const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
              const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
              return dateB - dateA;
            });
            
            // Group by customer_id, keep only latest activity per customer
            const customerLatestActivity = new Map<string, any>();
            for (const activity of sortedActivities) {
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

          // Achievement: all closing
          achievementRevenue += activities
            .filter(act => act.jenis_aktivitas === "Closing")
            .reduce((sum: number, act: any) => sum + (Number(act.potential_value) || 0), 0);
        }

        salesSummaries.push({
          salesId: sales.id,
          salesName: sales.nama_lengkap || "Sales",
          targetRevenue,
          potentialRevenue,
          achievementRevenue,
          campaignCount: salesCampaigns.length,
        });
      }

      // Sort by achievement revenue
      salesSummaries.sort((a, b) => b.achievementRevenue - a.achievementRevenue);
      setTopSales(salesSummaries.slice(0, 8));

      setKpis({
        totalSales,
        totalGm,
        totalCampaigns,
        totalMasterCustomers,
        totalTargetRevenue,
        totalPotentialRevenue,
        totalAchievementRevenue,
      });
    };

    loadData();
  }, [selectedYear, currentYear]);

  const filteredTopSales = topSales.filter((s) =>
    s.salesName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-900 dark:text-slate-50">System Overview</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">Year</span>
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
          <CardDescription className="text-slate-600 dark:text-slate-400">Overall sales system summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Sales</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalSales}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total GM</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalGm}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Campaigns</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalCampaigns}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Master Customers</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalMasterCustomers}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Target Revenue</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">Rp {kpis.totalTargetRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Potential Revenue</div>
              <div className="text-blue-600 dark:text-blue-400 text-2xl font-semibold">Rp {kpis.totalPotentialRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Achievement Revenue</div>
              <div className="text-green-600 dark:text-green-400 text-2xl font-semibold">Rp {kpis.totalAchievementRevenue.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Monthly Revenue (Closing)</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Monthly revenue distribution in {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.every(v => v === 0) ? (
            <p className="text-slate-600 dark:text-slate-400">No revenue for this year yet.</p>
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
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-900 dark:text-slate-50">Top Sales by Achievement</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>
          <CardDescription className="text-slate-600 dark:text-slate-400">Berdasarkan achievement revenue dari campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTopSales.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">Tidak ada data.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopSales.map((s) => {
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
                        <div className="text-blue-600 dark:text-blue-400 font-semibold">Rp {s.potentialRevenue.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Achievement</div>
                        <div className="text-green-600 dark:text-green-400 font-semibold">Rp {s.achievementRevenue.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
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
    </div>
  );
}
