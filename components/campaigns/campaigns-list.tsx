"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, Eye } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { CampaignDialog } from "./campaign-dialog";

export function CampaignsList({ initialCampaigns, userRole, userId }: any) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const router = useRouter();
  const isPresales = userRole === "Presales";

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      (campaign.master_customers as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.master_campaigns as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.users as any)?.nama_lengkap?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

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
    if (!confirm("Yakin ingin menghapus campaign ini?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (err: any) {
      alert("Gagal menghapus campaign: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Cari campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
          />
        </div>
        {!isPresales && (
          <Button
            onClick={() => {
              setEditingCampaign(null);
              setShowDialog(true);
            }}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Campaign
          </Button>
        )}
      </div>

      {showDialog && (
        <CampaignDialog
          campaign={editingCampaign}
          onClose={() => {
            setShowDialog(false);
            setEditingCampaign(null);
          }}
          onSave={handleCampaignSaved}
          userRole={userRole}
          userId={userId}
        />
      )}

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          {filteredCampaigns.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">Tidak ada campaign ditemukan</p>
          ) : (
            <div className="space-y-2">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
                        {(campaign.master_customers as any)?.name} - {(campaign.master_campaigns as any)?.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>AM: {(campaign.users as any)?.nama_lengkap}</span>
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
                        className="text-blue-400 hover:text-blue-300"
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
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-400 hover:text-red-300"
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

