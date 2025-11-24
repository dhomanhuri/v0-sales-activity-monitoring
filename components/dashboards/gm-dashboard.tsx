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
  const [search, setSearch] = useState("");
  const currentYear = useMemo(() => new Date().getFullYear(), []);

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
      const campaignIdsSet = new Set<string>();
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

        // Track campaign IDs for later usage (recent activities lookup)
        for (const campaign of campaigns || []) {
          if (campaign?.id) {
            campaignIdsSet.add(campaign.id);
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
      // Latest activities removed

    };

    loadData();
  }, [userId, currentYear]);

  const filteredSummaries = summaries.filter((s) =>
    s.salesName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Team Performance ({team.length} AM)</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Monitor your AM team performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 dark:text-slate-400" />
            <Input
              placeholder="Cari AM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
            />
          </div>

          {filteredSummaries.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No performance data found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSummaries.map((s) => {
                const percent = s.targetRevenue > 0 ? Math.min((s.achievementRevenue / s.targetRevenue) * 100, 100) : 0;
                return (
                  <div key={s.salesId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{s.salesName}</h3>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">Achievement: {percent.toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Target</div>
                        <div className="text-slate-900 dark:text-slate-50 font-semibold">Rp {s.targetRevenue.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Potential Leads</div>
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

    </div>
  );
}
