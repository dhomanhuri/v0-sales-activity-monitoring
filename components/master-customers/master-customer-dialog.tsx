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

export function MasterCustomerDialog({
  customer,
  onClose,
  onSave,
}: {
  customer: any | null;
  onClose: () => void;
  onSave: (customer: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        description: customer.description || "",
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (customer) {
        // Update existing customer
        const { data: updatedCustomer, error: updateError } = await supabase
          .from("master_customers")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer.id)
          .select()
          .single();

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
        onSave(updatedCustomer);
      } else {
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from("master_customers")
          .insert(formData)
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
        onSave(newCustomer);
      }
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "Terjadi kesalahan. Pastikan tabel master_customers sudah dibuat di database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-50">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Tambah Customer Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-300">Nama Customer*</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-slate-50"
              required
            />
          </div>

          <div>
            <Label className="text-slate-300">Deskripsi</Label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 min-h-24"
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

