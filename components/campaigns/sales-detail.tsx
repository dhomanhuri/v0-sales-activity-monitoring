"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Eye, ArrowLeft, Target, Users, DollarSign, TrendingUp, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { CampaignDialog } from "./campaign-dialog";

export function SalesDetail({ sales, initialCampaigns, userRole, userId }: any) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [achievementFilter, setAchievementFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const router = useRouter();
  const isPresales = userRole === "Presales" || userRole === "Engineer";

  const handleCampaignSaved = (updatedCampaign: any) => {
    if (editingCampaign) {
      setCampaigns(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
      setEditingCampaign(null);
    } else {
      setCampaigns([updatedCampaign, ...campaigns]);
    }
    setShowDialog(false);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (err: any) {
      alert("Failed to delete campaign: " + err.message);
    }
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    // Filter first
    let filtered = campaigns.filter((campaign: any) => {
      const masterCampaign = campaign.master_campaigns as any;
      const campaignName = masterCampaign?.name || "";
      const campaignDesc = masterCampaign?.description || "";
      
      const matchesSearch =
        campaignName.toLowerCase().includes(search.toLowerCase()) ||
        campaignDesc.toLowerCase().includes(search.toLowerCase());
      
      const achievementRate = campaign.achievementRate || 0;
      const matchesAchievement = !achievementFilter || 
        (achievementFilter === "excellent" && achievementRate >= 100) ||
        (achievementFilter === "good" && achievementRate >= 50 && achievementRate < 100) ||
        (achievementFilter === "needs-improvement" && achievementRate < 50);
      
      return matchesSearch && matchesAchievement;
    });

    // Sort
    const [sortField, sortOrder] = sortBy.split("-");
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      const masterCampaignA = a.master_campaigns as any;
      const masterCampaignB = b.master_campaigns as any;
      
      switch (sortField) {
        case "name":
          const nameA = masterCampaignA?.name || "";
          const nameB = masterCampaignB?.name || "";
          comparison = nameA.localeCompare(nameB);
          break;
        case "target":
          comparison = (Number(a.target_revenue) || 0) - (Number(b.target_revenue) || 0);
          break;
        case "achievement":
          comparison = (a.achievementRate || 0) - (b.achievementRate || 0);
          break;
        case "leads":
          comparison = (a.potentialLeads || 0) - (b.potentialLeads || 0);
          break;
        case "revenue":
          comparison = (a.achievementRevenue || 0) - (b.achievementRevenue || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [campaigns, search, achievementFilter, sortBy]);

  const hasActiveFilters = achievementFilter;

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/campaigns")}
            className="mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Campaign - {sales.nama_lengkap}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage campaigns for this AM</p>
        </div>
        {!isPresales && (
          <Button
            onClick={() => {
              setEditingCampaign(null);
              setShowDialog(true);
            }}
            className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Plus className="h-4 w-4" />
            Add Campaign
          </Button>
        )}
      </div>

      {showDialog && (
        <CampaignDialog
          campaign={editingCampaign}
          salesId={sales.id}
          onClose={() => {
            setShowDialog(false);
            setEditingCampaign(null);
          }}
          onSave={handleCampaignSaved}
          userRole={userRole}
          userId={userId}
        />
      )}

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-transparent dark:from-slate-800 dark:to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-xl font-bold">Campaign List</CardTitle>
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search by campaign name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
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
                    1
                  </span>
                )}
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50"
              >
                <option value="name-asc">Sort: Campaign Name (A-Z)</option>
                <option value="name-desc">Sort: Campaign Name (Z-A)</option>
                <option value="target-desc">Sort: Target Revenue (High-Low)</option>
                <option value="target-asc">Sort: Target Revenue (Low-High)</option>
                <option value="achievement-desc">Sort: Achievement Rate (High-Low)</option>
                <option value="achievement-asc">Sort: Achievement Rate (Low-High)</option>
                <option value="leads-desc">Sort: Potential Leads (High-Low)</option>
                <option value="leads-asc">Sort: Potential Leads (Low-High)</option>
                <option value="revenue-desc">Sort: Achievement Revenue (High-Low)</option>
                <option value="revenue-asc">Sort: Achievement Revenue (Low-High)</option>
              </select>
            </div>
            {showFilters && (
              <div className="flex gap-4 items-end">
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
                    onClick={() => setAchievementFilter("")}
                    className="border-red-200 dark:border-red-600 text-red-600 dark:text-red-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filter
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedCampaigns.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-12">
              {campaigns.length === 0 ? "No campaigns found" : "No campaigns match your search/filter"}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedCampaigns.map((campaign: any) => {
                const masterCampaign = campaign.master_campaigns as any;
                const targetRevenue = Number(campaign.target_revenue) || 0;
                const potentialLeads = campaign.potentialLeads || 0;
                const achievementRevenue = campaign.achievementRevenue || 0;
                const achievementRate = campaign.achievementRate || 0;
                
                const achievementColor = achievementRate >= 100 
                  ? "text-green-600 dark:text-green-400" 
                  : achievementRate >= 50 
                  ? "text-yellow-600 dark:text-yellow-400" 
                  : "text-red-600 dark:text-red-400";

                return (
                  <div
                    key={campaign.id}
                    className="p-6 rounded-xl bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-700 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-2">
                          {masterCampaign?.name || "Unnamed Campaign"}
                        </h3>
                        {masterCampaign?.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {masterCampaign.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isPresales && (userRole === "Admin" || userRole === "GM" || userRole === "GM Non Sales" || campaign.sales_id === userId) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCampaign(campaign);
                                setShowDialog(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {/* Target Revenue */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Target className="h-3 w-3" />
                          <span>Target Revenue</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          Rp {targetRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>

                      {/* Potential Leads */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Users className="h-3 w-3" />
                          <span>Potential Leads</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          {potentialLeads}
                        </p>
                      </div>

                      {/* Achievement Revenue */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <DollarSign className="h-3 w-3" />
                          <span>Achievement Revenue</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          Rp {achievementRevenue.toLocaleString('id-ID')}
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
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex items-center justify-between text-xs mb-2">
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

