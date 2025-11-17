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

export function CustomerDialog({
  customer,
  onClose,
  onSave,
  userRole,
  userId,
}: {
  customer: any | null;
  onClose: () => void;
  onSave: (customer: any) => void;
  userRole: string;
  userId: string;
}) {
  const [formData, setFormData] = useState({
    nama_perusahaan: "",
    nama_pic: "",
    jabatan_pic: "",
    email_pic: "",
    nomor_hp: "",
    industri: "",
    asal_lead: "",
    nilai_potensial: 0,
    status_pipeline: "Lead",
    kota: "",
    catatan: "",
    sales_id: userId, // add sales_id to form data
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [salesList, setSalesList] = useState<any[]>([]); // add state for sales list
  const [loadingSales, setLoadingSales] = useState(false); // add loading state for sales

  useEffect(() => {
    if (customer) {
      setFormData({
        nama_perusahaan: customer.nama_perusahaan,
        nama_pic: customer.nama_pic,
        jabatan_pic: customer.jabatan_pic || "",
        email_pic: customer.email_pic || "",
        nomor_hp: customer.nomor_hp || "",
        industri: customer.industri || "",
        asal_lead: customer.asal_lead || "",
        nilai_potensial: customer.nilai_potensial || 0,
        status_pipeline: customer.status_pipeline,
        kota: customer.kota || "",
        catatan: customer.catatan || "",
        sales_id: customer.sales_id || userId, // set from customer
      });
    }
  }, [customer, userId]);

  useEffect(() => {
    if (userRole === "GM" || userRole === "Admin") {
      loadSalesList();
    }
  }, [userRole]);

  const loadSalesList = async () => {
    setLoadingSales(true);
    try {
      const supabase = createClient();
      
      let query = supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("role", "Sales");

      if (userRole === "GM") {
        query = query.eq("gm_id", userId);
      }

      const { data } = await query;
      setSalesList(data || []);
    } catch (err) {
      console.error("Error loading sales:", err);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (customer) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from("customers")
          .update({
            ...formData,
            nilai_potensial: parseFloat(formData.nilai_potensial.toString()),
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer.id);

        if (updateError) throw updateError;
        onSave({ ...customer, ...formData });
      } else {
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({
            ...formData,
            nilai_potensial: parseFloat(formData.nilai_potensial.toString()),
            sales_id: formData.sales_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        onSave(newCustomer);
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
          <DialogTitle>{customer ? "Edit Customer" : "Tambah Customer Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={loadingSales}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Company Name*</Label>
              <Input
                value={formData.nama_perusahaan}
                onChange={(e) =>
                  setFormData({ ...formData, nama_perusahaan: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Industry*</Label>
              <select
                value={formData.industri}
                onChange={(e) =>
                  setFormData({ ...formData, industri: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
                required
              >
                <option value="">Select Industry</option>
                <option value="Government">Government</option>
                <option value="FSI">FSI</option>
                <option value="Energy">Energy</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">PIC Name*</Label>
              <Input
                value={formData.nama_pic}
                onChange={(e) =>
                  setFormData({ ...formData, nama_pic: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">PIC Position</Label>
              <Input
                value={formData.jabatan_pic}
                onChange={(e) =>
                  setFormData({ ...formData, jabatan_pic: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Email PIC</Label>
              <Input
                type="email"
                value={formData.email_pic}
                onChange={(e) =>
                  setFormData({ ...formData, email_pic: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-300">Phone Number</Label>
              <Input
                value={formData.nomor_hp}
                onChange={(e) =>
                  setFormData({ ...formData, nomor_hp: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Status Pipeline</Label>
              <select
                value={formData.status_pipeline}
                onChange={(e) =>
                  setFormData({ ...formData, status_pipeline: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
              >
                <option value="Lead">Lead</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Proposal Dikirim">Proposal Dikirim</option>
                <option value="Negosiasi">Negosiasi</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-300">Potential Value (Rp)</Label>
              <Input
                type="number"
                value={formData.nilai_potensial}
                onChange={(e) =>
                  setFormData({ ...formData, nilai_potensial: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Lead Source</Label>
              <Input
                placeholder="Cold Call, Referral, Event, Online Ads"
                value={formData.asal_lead}
                onChange={(e) =>
                  setFormData({ ...formData, asal_lead: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-300">City</Label>
              <Input
                value={formData.kota}
                onChange={(e) =>
                  setFormData({ ...formData, kota: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-slate-50"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Notes</Label>
            <textarea
              value={formData.catatan}
              onChange={(e) =>
                setFormData({ ...formData, catatan: e.target.value })
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
