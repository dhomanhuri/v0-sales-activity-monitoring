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
  onClose,
  onSave,
  userRole,
  userId,
}: {
  campaign: any | null;
  onClose: () => void;
  onSave: (campaign: any) => void;
  userRole: string;
  userId: string;
}) {
  const [formData, setFormData] = useState({
    customer_id: "",
    campaign_id: "",
    sales_id: userId,
    target_revenue: 0,
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [masterCampaigns, setMasterCampaigns] = useState<any[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Load master customers
      const { data: customersData } = await supabase
        .from("master_customers")
        .select("id, name")
        .order("name");
      setCustomers(customersData || []);

      // Load master campaigns
      const { data: campaignsData } = await supabase
        .from("master_campaigns")
        .select("id, name")
        .order("name");
      setMasterCampaigns(campaignsData || []);

      // Load sales list (for GM/Admin)
      if (userRole === "GM" || userRole === "Admin") {
        let query = supabase
          .from("users")
          .select("id, nama_lengkap")
          .eq("role", "Sales");

        if (userRole === "GM") {
          query = query.eq("gm_id", userId);
        }

        const { data: salesData } = await query;
        setSalesList(salesData || []);
      }
    };

    loadData();

    if (campaign) {
      setFormData({
        customer_id: campaign.customer_id,
        campaign_id: campaign.campaign_id,
        sales_id: campaign.sales_id,
        target_revenue: campaign.target_revenue || 0,
      });
    }
  }, [campaign, userId, userRole]);

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
            master_customers:customer_id(name),
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
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "Tambah Campaign Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-300">Customer*</Label>
            <select
              value={formData.customer_id}
              onChange={(e) =>
                setFormData({ ...formData, customer_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
              required
            >
              <option value="">Pilih Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-300">Campaign*</Label>
            <select
              value={formData.campaign_id}
              onChange={(e) =>
                setFormData({ ...formData, campaign_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
              required
            >
              <option value="">Pilih Campaign</option>
              {masterCampaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          {(userRole === "GM" || userRole === "Admin") && (
            <div>
              <Label className="text-slate-300">Sales*</Label>
              <select
                value={formData.sales_id}
                onChange={(e) =>
                  setFormData({ ...formData, sales_id: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
                required
              >
                <option value="">Pilih Sales</option>
                {salesList.map((sales) => (
                  <option key={sales.id} value={sales.id}>
                    {sales.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label className="text-slate-300">Target Revenue (Rp)</Label>
            <Input
              type="number"
              min="0"
              value={formData.target_revenue}
              onChange={(e) =>
                setFormData({ ...formData, target_revenue: parseFloat(e.target.value) || 0 })
              }
              className="bg-slate-700 border-slate-600 text-slate-50"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

