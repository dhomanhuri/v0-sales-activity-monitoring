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

export function CampaignActivityDialog({
  activity,
  campaignId,
  onClose,
  onSave,
}: {
  activity: any | null;
  campaignId: string;
  onClose: () => void;
  onSave: (activity: any) => void;
}) {
  const [formData, setFormData] = useState({
    customer_id: "",
    jenis_aktivitas: "Initiate Call",
    keterangan: "",
    potential_value: 0,
    tanggal_aktivitas: new Date().toISOString().split('T')[0],
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      const supabase = createClient();
      const { data: customersData } = await supabase
        .from("master_customers")
        .select("id, name")
        .order("name");
      setCustomers(customersData || []);
    };

    loadCustomers();

    if (activity) {
      setFormData({
        customer_id: activity.customer_id || "",
        jenis_aktivitas: activity.jenis_aktivitas,
        keterangan: activity.keterangan || "",
        potential_value: activity.potential_value || 0,
        tanggal_aktivitas: activity.tanggal_aktivitas || new Date().toISOString().split('T')[0],
      });
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate: Closing must have potential_value
    if (formData.jenis_aktivitas === "Closing" && (!formData.potential_value || formData.potential_value <= 0)) {
      setError("Potential Value wajib diisi untuk aktivitas Closing");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      if (activity) {
        // Update existing activity
        const { error: updateError } = await supabase
          .from("campaign_activities")
          .update({
            customer_id: formData.customer_id,
            jenis_aktivitas: formData.jenis_aktivitas,
            keterangan: formData.keterangan,
            potential_value: parseFloat(formData.potential_value.toString()),
            tanggal_aktivitas: formData.tanggal_aktivitas,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activity.id);

        if (updateError) throw updateError;
        onSave({ ...activity, ...formData });
      } else {
        // Create new activity
        const { data: newActivity, error: insertError } = await supabase
          .from("campaign_activities")
          .insert({
            campaign_id: campaignId,
            customer_id: formData.customer_id,
            jenis_aktivitas: formData.jenis_aktivitas,
            keterangan: formData.keterangan,
            potential_value: parseFloat(formData.potential_value.toString()),
            tanggal_aktivitas: formData.tanggal_aktivitas,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        onSave(newActivity);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">{activity ? "Edit Aktivitas" : "Tambah Aktivitas Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Customer*</Label>
              <select
                value={formData.customer_id}
                onChange={(e) =>
                  setFormData({ ...formData, customer_id: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
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
              <Label className="text-slate-700 dark:text-slate-300">Aktivitas*</Label>
              <select
                value={formData.jenis_aktivitas}
                onChange={(e) =>
                  setFormData({ ...formData, jenis_aktivitas: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
                required
              >
                <option value="Initiate Call">Initiate Call</option>
                <option value="Presentation">Presentation</option>
                <option value="Demo">Demo</option>
                <option value="POC">POC</option>
                <option value="Tender">Tender</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closing">Closing</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Tanggal Aktivitas*</Label>
            <Input
              type="date"
              value={formData.tanggal_aktivitas}
              onChange={(e) =>
                setFormData({ ...formData, tanggal_aktivitas: e.target.value })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              required
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Keterangan</Label>
            <textarea
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 min-h-24"
              placeholder="Masukkan keterangan aktivitas..."
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">
              Potential Value (Rp)
              {formData.jenis_aktivitas === "Closing" && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="number"
              min="0"
              value={formData.potential_value}
              onChange={(e) =>
                setFormData({ ...formData, potential_value: parseFloat(e.target.value) || 0 })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              required={formData.jenis_aktivitas === "Closing"}
            />
            {formData.jenis_aktivitas === "Closing" && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Nilai ini akan menjadi Achievement Revenue pada campaign
              </p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

