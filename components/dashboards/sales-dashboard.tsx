"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    targetRevenue: 0,
    potentialRevenue: 0,
    achievementRevenue: 0,
    recentActivities: [] as any[],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClient();

      // Get all campaigns for this sales
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, target_revenue")
        .eq("sales_id", userId);

      // Calculate Target Revenue
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

      // Calculate Achievement Revenue (all Closing activities)
      let achievementRevenue = 0;
      const campaignIds = (campaigns || []).map(c => c.id);
      if (campaignIds.length > 0) {
        const { data: closings } = await supabase
          .from("campaign_activities")
          .select("potential_value")
          .in("campaign_id", campaignIds)
          .eq("jenis_aktivitas", "Closing");
        
        achievementRevenue = (closings || []).reduce((sum: number, act: any) => {
          return sum + (Number(act.potential_value) || 0);
        }, 0);
      }

      // Get recent activities
      if (campaignIds.length > 0) {
        const { data: activities } = await supabase
          .from("campaign_activities")
          .select(`
            *,
            campaigns:campaign_id(
              master_customers:customer_id(name),
              master_campaigns:campaign_id(name)
            )
          `)
          .in("campaign_id", campaignIds)
          .order("tanggal_aktivitas", { ascending: false })
          .limit(5);
        
        setStats({
          totalCampaigns: campaigns?.length || 0,
          targetRevenue,
          potentialRevenue,
          achievementRevenue,
          recentActivities: activities || [],
        });
      } else {
        setStats({
          totalCampaigns: 0,
          targetRevenue: 0,
          potentialRevenue: 0,
          achievementRevenue: 0,
          recentActivities: [],
        });
      }
    };

    loadDashboard();
  }, [userId]);

  const progressPercent = stats.targetRevenue > 0 
    ? Math.min((stats.achievementRevenue / stats.targetRevenue) * 100, 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">Rp {stats.targetRevenue.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Rp {stats.potentialRevenue.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Achievement Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">Rp {stats.achievementRevenue.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Progress Target</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Achievement vs Target Revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Progress</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-700 dark:text-slate-300">
                Achievement: <span className="font-semibold text-green-600 dark:text-green-400">Rp {stats.achievementRevenue.toLocaleString('id-ID')}</span>
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Target: <span className="font-semibold text-slate-900 dark:text-slate-50">Rp {stats.targetRevenue.toLocaleString('id-ID')}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Aktivitas Terbaru</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">5 aktivitas terbaru dari campaign Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentActivities.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">Tidak ada aktivitas terbaru</p>
            ) : (
              stats.recentActivities.map((activity) => {
                const campaign = (activity.campaigns as any);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {activity.jenis_aktivitas}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {campaign?.master_customers?.name} - {campaign?.master_campaigns?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      {activity.potential_value && (
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Rp {Number(activity.potential_value).toLocaleString('id-ID')}
                        </p>
                      )}
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(activity.tanggal_aktivitas || activity.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
