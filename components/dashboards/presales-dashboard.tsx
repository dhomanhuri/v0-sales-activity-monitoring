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
  campaignCount: number;
};

export function PresalesDashboard() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [kpis, setKpis] = useState({
    totalSales: 0,
    totalGm: 0,
    totalCampaigns: 0,
    totalMasterCustomers: 0,
    totalTargetRevenue: 0,
    totalPotentialLeads: 0,
    totalAchievementRevenue: 0,
    totalAchievementRate: 0,
  });
  const [topSales, setTopSales] = useState<SalesSummary[]>([]);
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
      let totalPotentialLeads = 0;
      let totalAchievementRevenue = 0;
      const uniqueCustomers = new Set<string>();

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
        // Get all activities for potential leads and achievement calculation
        const { data: allActivities } = await supabase
          .from("campaign_activities")
          .select("campaign_id, customer_id, jenis_aktivitas, potential_value, tanggal_aktivitas, created_at")
          .in("campaign_id", allCampaignIds);

        // Calculate total potential leads (unique customers from all activities)
        for (const act of allActivities || []) {
          if (act.customer_id) {
            uniqueCustomers.add(act.customer_id);
          }
        }
        totalPotentialLeads = uniqueCustomers.size;

        // Calculate achievement revenue
        for (const act of allActivities || []) {
          if (act.jenis_aktivitas === "Closing") {
            totalAchievementRevenue += Number(act.potential_value) || 0;
          }
        }
      }

      // Build sales summaries (without achievement revenue)
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
        .select("campaign_id, customer_id, potential_value, tanggal_aktivitas, created_at");

      // Group activities by campaign_id
      const activitiesByCampaign = new Map<string, any[]>();
      for (const act of allActivitiesForSummary || []) {
        const campId = act.campaign_id;
        if (!activitiesByCampaign.has(campId)) {
          activitiesByCampaign.set(campId, []);
        }
        activitiesByCampaign.get(campId)!.push(act);
      }

      // Calculate for each sales (without achievement revenue)
      for (const sales of salesUsers || []) {
        const salesCampaigns = salesCampaignsMap.get(sales.id) || [];
        
        const targetRevenue = salesCampaigns.reduce((sum: number, camp: any) => {
          return sum + (Number(camp.target_revenue) || 0);
        }, 0);

        let potentialRevenue = 0;
        
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
        }

        salesSummaries.push({
          salesId: sales.id,
          salesName: sales.nama_lengkap || "Sales",
          targetRevenue,
          potentialRevenue,
          campaignCount: salesCampaigns.length,
        });
      }

      // Sort by potential revenue
      salesSummaries.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
      setTopSales(salesSummaries.slice(0, 8));

      // Calculate achievement rate
      const totalAchievementRate = totalTargetRevenue > 0 
        ? (totalAchievementRevenue / totalTargetRevenue) * 100 
        : 0;

      setKpis({
        totalSales,
        totalGm,
        totalCampaigns,
        totalMasterCustomers,
        totalTargetRevenue,
        totalPotentialLeads,
        totalAchievementRevenue,
        totalAchievementRate: Math.round(totalAchievementRate * 100) / 100,
      });
    };

    loadData();
  }, [currentYear]);

  const filteredTopSales = topSales.filter((s) =>
    s.salesName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">System Overview (Read-Only)</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Overall AM system summary (Read-Only Access)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total AM</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalSales}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Department</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalGm}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Campaign</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalCampaigns}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Customer</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">{kpis.totalMasterCustomers}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Target Revenue</div>
              <div className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">Rp {kpis.totalTargetRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Potential Leads</div>
              <div className="text-blue-600 dark:text-blue-400 text-2xl font-semibold">{kpis.totalPotentialLeads}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Achievement Revenue</div>
              <div className="text-green-600 dark:text-green-400 text-2xl font-semibold">Rp {kpis.totalAchievementRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <div className="text-slate-600 dark:text-slate-400 text-xs mb-1">Total Achievement Rate</div>
              <div className="text-purple-600 dark:text-purple-400 text-2xl font-semibold">{kpis.totalAchievementRate.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-slate-900 dark:text-slate-50">Top AM by Potential</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search AM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>
          <CardDescription className="text-slate-600 dark:text-slate-400">Berdasarkan potential revenue dari campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTopSales.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">Tidak ada data.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopSales.map((s) => {
                return (
                  <div key={s.salesId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{s.salesName}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Target</div>
                        <div className="text-slate-900 dark:text-slate-50 font-semibold">Rp {s.targetRevenue.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Potential</div>
                        <div className="text-blue-600 dark:text-blue-400 font-semibold">Rp {s.potentialRevenue.toLocaleString('id-ID')}</div>
                      </div>
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

