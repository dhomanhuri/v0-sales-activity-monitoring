"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Eye, ArrowLeft } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { CampaignDialog } from "./campaign-dialog";

export function SalesDetail({ sales, initialCampaigns, userRole, userId }: any) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const router = useRouter();
  const isPresales = userRole === "Presales";

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
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage campaigns for this sales</p>
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
          <CardTitle className="text-slate-900 dark:text-slate-50 text-xl font-bold">Campaign List</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-12">No campaigns found</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="p-5 rounded-xl bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-700 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
                        {(campaign.master_campaigns as any)?.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        {campaign.target_revenue && (
                          <span>Target: Rp {campaign.target_revenue.toLocaleString('id-ID')}</span>
                        )}
                      </div>
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
                      {!isPresales && (userRole === "Admin" || userRole === "GM" || campaign.sales_id === userId) && (
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

