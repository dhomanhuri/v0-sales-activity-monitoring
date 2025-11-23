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
  defaultPic,
  defaultPotentialValue,
  defaultCustomerId,
}: {
  activity: any | null;
  campaignId: string;
  onClose: () => void;
  onSave: (activity: any) => void;
  defaultPic?: string;
  defaultPotentialValue?: number;
  defaultCustomerId?: string;
}) {
  const [formData, setFormData] = useState({
    customer_id: "",
    jenis_aktivitas: "Initiate Call",
    pic: "",
    keterangan: "",
    potential_value: 0,
    tanggal_aktivitas: new Date().toISOString().split('T')[0],
    presales: [] as string[],
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [presalesList, setPresalesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      
      // Load customers
      const { data: customersData } = await supabase
        .from("master_customers")
        .select("id, name")
        .order("name");
      setCustomers(customersData || []);

      // Load presales users
      const { data: presalesData } = await supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("role", "Presales")
        .eq("status_aktif", true)
        .order("nama_lengkap");
      setPresalesList(presalesData || []);
    };

    loadData();

    if (activity) {
      // Parse presales from JSONB array
      let presalesArray: string[] = [];
      if (activity.presales) {
        if (Array.isArray(activity.presales)) {
          presalesArray = activity.presales;
        } else if (typeof activity.presales === 'string') {
          try {
            presalesArray = JSON.parse(activity.presales);
          } catch {
            presalesArray = [];
          }
        }
      }

      setFormData({
        customer_id: activity.customer_id || "",
        jenis_aktivitas: activity.jenis_aktivitas,
        pic: activity.pic || "",
        keterangan: activity.keterangan || "",
        potential_value: activity.potential_value || 0,
        tanggal_aktivitas: activity.tanggal_aktivitas || new Date().toISOString().split('T')[0],
        presales: presalesArray,
      });
    } else if (defaultPic || defaultPotentialValue || defaultCustomerId) {
      // Set default values when creating new activity from customer card
      setFormData({
        customer_id: defaultCustomerId || "",
        jenis_aktivitas: "Initiate Call",
        pic: defaultPic || "",
        keterangan: "",
        potential_value: defaultPotentialValue || 0,
        tanggal_aktivitas: new Date().toISOString().split('T')[0],
        presales: [],
      });
    }
  }, [activity, defaultPic, defaultPotentialValue, defaultCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate: PIC is required
    if (!formData.pic || formData.pic.trim() === "") {
      setError("PIC is required");
      setIsLoading(false);
      return;
    }

    // Validate: Closing must have potential_value
    if (formData.jenis_aktivitas === "Closing" && (!formData.potential_value || formData.potential_value <= 0)) {
      setError("Potential Revenue is required for Closing activity");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Convert presales array to JSONB format (always array, empty if none selected)
      const presalesJsonb = formData.presales.length > 0 ? formData.presales : [];

      if (activity) {
        // Update existing activity
        const { error: updateError } = await supabase
          .from("campaign_activities")
          .update({
            customer_id: formData.customer_id,
            jenis_aktivitas: formData.jenis_aktivitas,
            pic: formData.pic,
            keterangan: formData.keterangan,
            potential_value: parseFloat(formData.potential_value.toString()),
            tanggal_aktivitas: formData.tanggal_aktivitas,
            presales: presalesJsonb,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activity.id);

        if (updateError) throw updateError;
        onSave({ ...activity, ...formData, presales: presalesJsonb });
      } else {
        // Create new activity
        const { data: newActivity, error: insertError } = await supabase
          .from("campaign_activities")
          .insert({
            campaign_id: campaignId,
            customer_id: formData.customer_id,
            jenis_aktivitas: formData.jenis_aktivitas,
            pic: formData.pic,
            keterangan: formData.keterangan,
            potential_value: parseFloat(formData.potential_value.toString()),
            tanggal_aktivitas: formData.tanggal_aktivitas,
            presales: presalesJsonb,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        onSave(newActivity);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">{activity ? "Edit Activity" : "Add New Activity"}</DialogTitle>
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
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Activity*</Label>
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
            <Label className="text-slate-700 dark:text-slate-300">Activity Date*</Label>
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
            <Label className="text-slate-700 dark:text-slate-300">PIC*</Label>
            <Input
              type="text"
              value={formData.pic}
              onChange={(e) =>
                setFormData({ ...formData, pic: e.target.value })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              placeholder="Enter PIC name..."
              required
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Description</Label>
            <textarea
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 min-h-24"
              placeholder="Enter activity description..."
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Presales</Label>
            <div className="space-y-2">
              <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-700 max-h-48 overflow-y-auto">
                {presalesList.length > 0 ? (
                  <div className="space-y-2">
                    {presalesList.map((presales) => (
                      <label
                        key={presales.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.presales.includes(presales.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                presales: [...formData.presales, presales.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                presales: formData.presales.filter((id) => id !== presales.id),
                              });
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-slate-900 dark:text-slate-50 text-sm">
                          {presales.nama_lengkap}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No presales available</p>
                )}
              </div>
              {formData.presales.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.presales.map((presalesId) => {
                    const presales = presalesList.find(p => p.id === presalesId);
                    return presales ? (
                      <span
                        key={presalesId}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-sm flex items-center gap-1"
                      >
                        {presales.nama_lengkap}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              presales: formData.presales.filter((id) => id !== presalesId),
                            });
                          }}
                          className="ml-1 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">
              {formData.jenis_aktivitas === "Closing" ? "Potential Revenue (Rp)" : "Potential Value (Rp)"}
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
                This value will become Achievement Revenue for the campaign
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

