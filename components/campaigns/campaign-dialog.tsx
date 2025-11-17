"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CampaignDialog({
  campaign,
  salesId,
  onClose,
  onSave,
  userRole,
  userId,
}: {
  campaign: any | null;
  salesId?: string;
  onClose: () => void;
  onSave: (campaign: any) => void;
  userRole: string;
  userId: string;
}) {
  const [formData, setFormData] = useState({
    campaign_id: "",
    sales_id: salesId || userId,
    target_revenue: 0,
  });
  const [masterCampaigns, setMasterCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Load master campaigns
      const { data: campaignsData } = await supabase
        .from("master_campaigns")
        .select("id, name")
        .order("name");
      setMasterCampaigns(campaignsData || []);
    };

    loadData();

    if (campaign) {
      setFormData({
        campaign_id: campaign.campaign_id,
        sales_id: campaign.sales_id,
        target_revenue: campaign.target_revenue || 0,
      });
    } else if (salesId) {
      setFormData({
        campaign_id: "",
        sales_id: salesId,
        target_revenue: 0,
      });
    }
  }, [campaign, salesId, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (campaign) {
        // Update existing campaign
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            ...formData,
            target_revenue: parseFloat(formData.target_revenue.toString()),
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        if (updateError) throw updateError;
        onSave({ ...campaign, ...formData });
      } else {
        // Create new campaign
        const { data: newCampaign, error: insertError } = await supabase
          .from("campaigns")
          .insert({
            ...formData,
            target_revenue: parseFloat(formData.target_revenue.toString()),
          })
          .select(`
            *,
            master_campaigns:campaign_id(name),
            users:sales_id(nama_lengkap)
          `)
          .single();

        if (insertError) throw insertError;
        onSave(newCampaign);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">{campaign ? "Edit Campaign" : "Add New Campaign"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-700 dark:text-slate-300">Campaign*</Label>
            <select
              value={formData.campaign_id}
              onChange={(e) =>
                setFormData({ ...formData, campaign_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
              required
            >
              <option value="">Select Campaign</option>
              {masterCampaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Target Revenue (Rp)*</Label>
            <Input
              type="number"
              min="0"
              value={formData.target_revenue}
              onChange={(e) =>
                setFormData({ ...formData, target_revenue: parseFloat(e.target.value) || 0 })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

