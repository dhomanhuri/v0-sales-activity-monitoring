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

export function TargetDialog({
  target,
  onClose,
  onSave,
  userId,
  salesList,
}: {
  target: any | null;
  onClose: () => void;
  onSave: (target: any) => void;
  userId: string;
  salesList: any[];
}) {
  const [formData, setFormData] = useState({
    sales_id: "",
    periode_tahun: new Date().getFullYear(),
    target_jumlah_lead: 0,
    target_jumlah_proposal: 0,
    target_jumlah_closing: 0,
    target_nilai_revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (target) {
      setFormData({
        sales_id: target.sales_id,
        periode_tahun: target.periode_tahun,
        target_jumlah_lead: target.target_jumlah_lead || 0,
        target_jumlah_proposal: target.target_jumlah_proposal || 0,
        target_jumlah_closing: target.target_jumlah_closing || 0,
        target_nilai_revenue: target.target_nilai_revenue || 0,
      });
    }
  }, [target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (target) {
        // Update existing target
        const { error: updateError } = await supabase
          .from("targets")
          .update({
            ...formData,
            target_jumlah_lead: parseInt(formData.target_jumlah_lead.toString()),
            target_jumlah_proposal: parseInt(formData.target_jumlah_proposal.toString()),
            target_jumlah_closing: parseInt(formData.target_jumlah_closing.toString()),
            target_nilai_revenue: parseFloat(formData.target_nilai_revenue.toString()),
            updated_at: new Date().toISOString(),
          })
          .eq("id", target.id);

        if (updateError) throw updateError;
        onSave({ ...target, ...formData });
      } else {
        // Create new target
        const { data: newTarget, error: insertError } = await supabase
          .from("targets")
          .insert({
            ...formData,
            gm_id: userId,
            target_jumlah_lead: parseInt(formData.target_jumlah_lead.toString()),
            target_jumlah_proposal: parseInt(formData.target_jumlah_proposal.toString()),
            target_jumlah_closing: parseInt(formData.target_jumlah_closing.toString()),
            target_nilai_revenue: parseFloat(formData.target_nilai_revenue.toString()),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        onSave(newTarget);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-50">
        <DialogHeader>
          <DialogTitle>{target ? "Edit Target" : "Tambah Target Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label className="text-slate-300">Periode Tahun*</Label>
            <select
              value={formData.periode_tahun}
              onChange={(e) =>
                setFormData({ ...formData, periode_tahun: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
              required
            >
              <option value="">Pilih Tahun</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Target Jumlah Lead</Label>
              <Input
                type="number"
                min="0"
                value={formData.target_jumlah_lead}
                onChange={(e) =>
                  setFormData({ ...formData, target_jumlah_lead: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-300">Target Jumlah Proposal</Label>
              <Input
                type="number"
                min="0"
                value={formData.target_jumlah_proposal}
                onChange={(e) =>
                  setFormData({ ...formData, target_jumlah_proposal: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Target Jumlah Closing</Label>
              <Input
                type="number"
                min="0"
                value={formData.target_jumlah_closing}
                onChange={(e) =>
                  setFormData({ ...formData, target_jumlah_closing: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-300">Target Nilai Revenue (Rp)</Label>
              <Input
                type="number"
                min="0"
                value={formData.target_nilai_revenue}
                onChange={(e) =>
                  setFormData({ ...formData, target_nilai_revenue: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
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
