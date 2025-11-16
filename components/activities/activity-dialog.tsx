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

export function ActivityDialog({
  activity,
  onClose,
  onSave,
  userId,
  userRole,
}: {
  activity: any | null;
  onClose: () => void;
  onSave: (activity: any) => void;
  userId: string;
  userRole: string;
}) {
  const [formData, setFormData] = useState({
    customer_id: "",
    jenis_aktivitas_id: "",
    tanggal_aktivitas: new Date().toISOString().split('T')[0],
    status_aktivitas: "Planned",
    catatan: "",
    next_step: "",
    lampiran_link: "",
  });
  const [selectedSalesId, setSelectedSalesId] = useState<string>("");
  const [salesList, setSalesList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // If GM/Admin: load selectable sales list. If Sales: set selected to self.
      if (userRole === "GM") {
        const { data: gmSales } = await supabase
          .from("users")
          .select("id, nama_lengkap")
          .eq("role", "Sales")
          .eq("status_aktif", true)
          .eq("gm_id", userId);
        setSalesList(gmSales || []);
        // If editing, prefer existing activity's sales; else none selected initially
        if (!activity) {
          setSelectedSalesId("");
        }
      } else if (userRole === "Admin") {
        const { data: allSales } = await supabase
          .from("users")
          .select("id, nama_lengkap")
          .eq("role", "Sales")
          .eq("status_aktif", true);
        setSalesList(allSales || []);
        if (!activity) {
          setSelectedSalesId("");
        }
      } else {
        // Sales role
        setSelectedSalesId(userId);
      }

      // Load activity types
      const { data: typesData } = await supabase
        .from("activity_types")
        .select("*");
      setActivityTypes(typesData || []);
    };

    loadData();

    if (activity) {
      setFormData({
        customer_id: activity.customer_id,
        jenis_aktivitas_id: activity.jenis_aktivitas_id,
        tanggal_aktivitas: activity.tanggal_aktivitas,
        status_aktivitas: activity.status_aktivitas,
        catatan: activity.catatan || "",
        next_step: activity.next_step || "",
        lampiran_link: activity.lampiran_link || "",
      });
      // Ensure selected sales for editing mode (if present on record)
      if (activity.sales_id) {
        setSelectedSalesId(activity.sales_id);
      }
    }
  }, [activity, userId, userRole]);

  // Load customers whenever selectedSalesId changes
  useEffect(() => {
    const loadCustomers = async () => {
      if (!selectedSalesId) {
        setCustomers([]);
        return;
      }
      const supabase = createClient();
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, nama_perusahaan")
        .eq("sales_id", selectedSalesId);
      setCustomers(customersData || []);
    };
    loadCustomers();
  }, [selectedSalesId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (activity) {
        // Update existing activity
        const { error: updateError } = await supabase
          .from("activities")
          .update({
            ...formData,
            sales_id: selectedSalesId || userId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activity.id);

        if (updateError) throw updateError;
        onSave({ ...activity, ...formData, sales_id: selectedSalesId || userId });
      } else {
        // Create new activity
        const { data: newActivity, error: insertError } = await supabase
          .from("activities")
          .insert({
            ...formData,
            sales_id: selectedSalesId || userId,
          })
          .select(`
            *,
            customers:customer_id(nama_perusahaan),
            activity_types:jenis_aktivitas_id(nama_aktivitas)
          `)
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
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? "Edit Aktivitas" : "Tambah Aktivitas Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(userRole === "GM" || userRole === "Admin") && (
            <div>
              <Label className="text-slate-300">Sales*</Label>
              <select
                value={selectedSalesId}
                onChange={(e) => setSelectedSalesId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
                required
              >
                <option value="">Pilih Sales</option>
                {salesList && salesList.length > 0 ? (
                  salesList.map((sales) => (
                    <option key={sales.id} value={sales.id}>
                      {sales.nama_lengkap}
                    </option>
                  ))
                ) : (
                  <option disabled>Tidak ada sales tersedia</option>
                )}
              </select>
            </div>
          )}
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
                  {customer.nama_perusahaan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-300">Jenis Aktivitas*</Label>
            <select
              value={formData.jenis_aktivitas_id}
              onChange={(e) =>
                setFormData({ ...formData, jenis_aktivitas_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
              required
            >
              <option value="">Pilih Aktivitas</option>
              {activityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nama_aktivitas}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Tanggal Aktivitas*</Label>
              <Input
                type="date"
                value={formData.tanggal_aktivitas}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal_aktivitas: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <select
                value={formData.status_aktivitas}
                onChange={(e) =>
                  setFormData({ ...formData, status_aktivitas: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Catatan</Label>
            <textarea
              value={formData.catatan}
              onChange={(e) =>
                setFormData({ ...formData, catatan: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 min-h-24"
            />
          </div>

          <div>
            <Label className="text-slate-300">Langkah Selanjutnya</Label>
            <Input
              value={formData.next_step}
              onChange={(e) =>
                setFormData({ ...formData, next_step: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-slate-50"
            />
          </div>

          <div>
            <Label className="text-slate-300">Link Lampiran</Label>
            <Input
              value={formData.lampiran_link}
              onChange={(e) =>
                setFormData({ ...formData, lampiran_link: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-slate-50"
              placeholder="https://example.com/file"
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
