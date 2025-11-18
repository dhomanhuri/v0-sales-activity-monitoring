"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CampaignActivityDialog } from "./campaign-activity-dialog";
import { createClient } from "@/lib/supabase/client";

export function CampaignDetail({ campaign, activities: initialActivities, userRole, userId }: any) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const canEdit = userRole === "Admin" || userRole === "GM" || campaign.sales_id === userId;

  // Group activities by customer
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, any[]>();
    
    // Sort activities by tanggal_aktivitas descending
    const sortedActivities = [...activities].sort((a: any, b: any) => {
      const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
      const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
      return dateB - dateA;
    });
    
    for (const activity of sortedActivities) {
      const customerId = activity.customer_id || 'no-customer';
      const customerName = (activity.master_customers as any)?.name || 'No Customer';
      
      if (!groups.has(customerId)) {
        groups.set(customerId, []);
      }
      groups.get(customerId)!.push(activity);
    }
    
    return Array.from(groups.entries()).map(([customerId, activities]) => ({
      customerId,
      customerName: activities[0]?.master_customers?.name || 'No Customer',
      activities,
    }));
  }, [activities]);

  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const handleActivitySaved = (updatedActivity: any) => {
    if (editingActivity) {
      setActivities(activities.map((a: any) => a.id === updatedActivity.id ? updatedActivity : a));
      setEditingActivity(null);
    } else {
      setActivities([updatedActivity, ...activities]);
    }
    setShowDialog(false);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaign_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
      setActivities(activities.filter((a: any) => a.id !== activityId));
    } catch (err: any) {
      alert("Failed to delete activity: " + err.message);
    }
  };

  // Potential Revenue adalah akumulasi potential value terakhir tiap customer
  // Group activities by customer_id, ambil yang terakhir per customer, lalu jumlahkan
  const potentialRevenue = (() => {
    const customerLatestActivity = new Map<string, any>();
    
    // Sort activities by tanggal_aktivitas descending
    const sortedActivities = [...activities].sort((a: any, b: any) => {
      const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
      const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
      return dateB - dateA;
    });
    
    // For each activity, keep only the latest one per customer
    for (const activity of sortedActivities) {
      const customerId = activity.customer_id;
      if (customerId && !customerLatestActivity.has(customerId)) {
        customerLatestActivity.set(customerId, activity);
      }
    }
    
    // Sum all potential_value from latest activities per customer
    let total = 0;
    for (const activity of customerLatestActivity.values()) {
      total += parseFloat(activity.potential_value) || 0;
    }
    
    return total;
  })();
  
  // Get latest activity for display (first activity in sorted list)
  const latestActivity = activities.length > 0 ? activities[0] : null;

  // Achievement Revenue adalah total dari semua aktivitas Closing
  const achievementRevenue = activities
    .filter((act: any) => act.jenis_aktivitas === "Closing")
    .reduce((sum: number, act: any) => 
      sum + (parseFloat(act.potential_value) || 0), 0
    );

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            // Get sales_id from campaign to go back to sales detail
            router.push(`/dashboard/campaigns/sales/${campaign.sales_id}`);
          }}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {(campaign.master_campaigns as any)?.name}
          </h1>
          {(campaign.master_campaigns as any)?.description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">
              {(campaign.master_campaigns as any)?.description}
            </p>
          )}
          {campaign.target_revenue && (
            <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm font-medium">
              Target: Rp {campaign.target_revenue.toLocaleString('id-ID')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Target Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
              Rp {(campaign.target_revenue || 0).toLocaleString('id-ID')}
            </p>
            <div className="h-1 w-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mt-2"></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800 border-blue-200 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              Rp {potentialRevenue.toLocaleString('id-ID')}
            </p>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-2"></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-slate-800 border-green-200 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-600 dark:text-green-400 text-xs font-semibold uppercase tracking-wider">Achievement Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              Rp {achievementRevenue.toLocaleString('id-ID')}
            </p>
            <div className="h-1 w-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full mt-2"></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-slate-800 border-purple-200 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3">
              {campaign.target_revenue ? 
                `${((achievementRevenue / campaign.target_revenue) * 100).toFixed(1)}%` : 
                'N/A'
              }
            </p>
            {campaign.target_revenue && (
              <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min((achievementRevenue / campaign.target_revenue) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/50 to-transparent dark:from-slate-800 dark:to-transparent pb-4">
          <CardTitle className="text-slate-900 dark:text-slate-50 text-xl font-bold">Campaign Activities</CardTitle>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingActivity(null);
                setShowDialog(true);
              }}
              className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showDialog && (
            <CampaignActivityDialog
              activity={editingActivity}
              campaignId={campaign.id}
              onClose={() => {
                setShowDialog(false);
                setEditingActivity(null);
              }}
              onSave={handleActivitySaved}
            />
          )}

          {activities.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">No activities found</p>
          ) : (
            <div className="space-y-3">
              {groupedActivities.map((group) => {
                const isExpanded = expandedCustomers.has(group.customerId);
                const activityCount = group.activities.length;
                
                // Calculate total potential value for this customer
                const totalPotential = group.activities.reduce((sum: number, act: any) => {
                  return sum + (parseFloat(act.potential_value) || 0);
                }, 0);
                
                return (
                  <div
                    key={group.customerId}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {/* Customer Header */}
                    <button
                      onClick={() => toggleCustomer(group.customerId)}
                      className="w-full p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-700 hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-600 dark:hover:to-slate-600 transition-all duration-200 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                            {group.customerName}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                            {totalPotential > 0 && (
                              <> • Total Potential: Rp {totalPotential.toLocaleString('id-ID')}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    {/* Activities List */}
                    {isExpanded && (
                      <div className="bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-800 dark:to-slate-800 border-t border-slate-200 dark:border-slate-600">
                        <div className="p-4 space-y-3">
                          {group.activities.map((activity: any) => (
                            <div
                              key={activity.id}
                              className="p-4 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                                      {activity.jenis_aktivitas}
                                    </h4>
                                    {activity.potential_value && (
                                      <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                        Rp {activity.potential_value.toLocaleString('id-ID')}
                                      </span>
                                    )}
                                  </div>
                                  {activity.pic && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                      PIC: <span className="font-medium text-slate-700 dark:text-slate-300">{activity.pic}</span>
                                    </p>
                                  )}
                                  {activity.keterangan && (
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                      {activity.keterangan}
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Date: {new Date(activity.tanggal_aktivitas || activity.created_at).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                {canEdit && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingActivity(activity);
                                        setShowDialog(true);
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
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

