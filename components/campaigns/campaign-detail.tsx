"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CampaignActivityDialog } from "./campaign-activity-dialog";
import { createClient } from "@/lib/supabase/client";

export function CampaignDetail({ campaign, activities: initialActivities, userRole, userId }: any) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const canEdit = userRole === "Admin" || userRole === "GM" || campaign.sales_id === userId;

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
    if (!confirm("Yakin ingin menghapus aktivitas ini?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaign_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
      setActivities(activities.filter((a: any) => a.id !== activityId));
    } catch (err: any) {
      alert("Gagal menghapus aktivitas: " + err.message);
    }
  };

  // Potential Revenue adalah nilai dari aktivitas terakhir berdasarkan tanggal_aktivitas
  // Activities sudah diurutkan berdasarkan tanggal_aktivitas descending
  const latestActivity = activities.length > 0 ? activities[0] : null;
  const potentialRevenue = latestActivity ? (parseFloat(latestActivity.potential_value) || 0) : 0;

  // Achievement Revenue adalah total dari semua aktivitas Closing
  const achievementRevenue = activities
    .filter((act: any) => act.jenis_aktivitas === "Closing")
    .reduce((sum: number, act: any) => 
      sum + (parseFloat(act.potential_value) || 0), 0
    );

  return (
    <div className="p-8 bg-slate-900 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/campaigns")}
          className="text-slate-300 hover:text-slate-50"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-50">
            {(campaign.master_customers as any)?.name} - {(campaign.master_campaigns as any)?.name}
          </h1>
          <p className="text-slate-400 mt-2">
            Sales: {(campaign.users as any)?.nama_lengkap}
            {campaign.target_revenue && (
              <> | Target: Rp {campaign.target_revenue.toLocaleString('id-ID')}</>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50 text-sm">Target Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-50">
              Rp {(campaign.target_revenue || 0).toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50 text-sm">Potential Revenue ({latestActivity?.jenis_aktivitas})</CardTitle>
            {/* {latestActivity && (
              <p className="text-xs text-slate-400 mt-1">
                Dari: {latestActivity.jenis_aktivitas}
              </p>
            )} */}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">
              Rp {potentialRevenue.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50 text-sm">Achievement Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              Rp {achievementRevenue.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50 text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-50">
              {campaign.target_revenue ? 
                `${((achievementRevenue / campaign.target_revenue) * 100).toFixed(1)}%` : 
                'N/A'
              }
            </p>
            {campaign.target_revenue && (
              <div className="mt-2 bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((achievementRevenue / campaign.target_revenue) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-50">Aktivitas Campaign</CardTitle>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingActivity(null);
                setShowDialog(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Aktivitas
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
            <p className="text-center text-slate-400 py-8">Tidak ada aktivitas ditemukan</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-lg bg-slate-700 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-50">
                          {activity.jenis_aktivitas}
                        </h3>
                        {activity.potential_value && (
                          <span className="text-sm text-green-400 font-semibold">
                            Rp {activity.potential_value.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                      {activity.keterangan && (
                        <p className="text-sm text-slate-300 mb-2">
                          {activity.keterangan}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        Tanggal: {new Date(activity.tanggal_aktivitas || activity.created_at).toLocaleDateString('id-ID', {
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
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

