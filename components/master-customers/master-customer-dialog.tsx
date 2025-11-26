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
  userRole,
  userId,
}: {
  customer: any | null;
  onClose: () => void;
  onSave: (customer: any) => void;
  userRole?: string;
  userId?: string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sales_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [salesList, setSalesList] = useState<any[]>([]);

  useEffect(() => {
    const loadSalesList = async () => {
      const supabase = createClient();
      let query = supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("role", "Sales")
        .eq("status_aktif", true);

      // If user is GM, only show their team
      if (userRole === "GM" || userRole === "GM Non Sales") {
        query = query.eq("gm_id", userId);
      } else if (userRole === "Sales") {
        // Sales can only assign to themselves
        query = query.eq("id", userId);
      }
      // Admin can see all sales

      const { data } = await query.order("nama_lengkap", { ascending: true });
      setSalesList(data || []);
    };

    loadSalesList();

    if (customer) {
      setFormData({
        name: customer.name,
        description: customer.description || "",
        sales_id: customer.sales_id || "",
      });
    } else if (userRole === "Sales" && userId) {
      // Pre-fill sales_id for Sales users
      setFormData({
        name: "",
        description: "",
        sales_id: userId,
      });
    }
  }, [customer, userRole, userId]);

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
            name: formData.name,
            description: formData.description,
            sales_id: formData.sales_id || null,
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
          .insert({
            name: formData.name,
            description: formData.description,
            sales_id: formData.sales_id || null,
          })
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
      setError(err.message || "An error occurred. Please ensure the master_customers table has been created in the database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-700 dark:text-slate-300">Customer Name*</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              required
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 min-h-24"
            />
          </div>

          {(userRole === "Admin" || userRole === "GM" || userRole === "GM Non Sales") && (
            <div>
              <Label className="text-slate-700 dark:text-slate-300">AM</Label>
              <select
                value={formData.sales_id}
                onChange={(e) =>
                  setFormData({ ...formData, sales_id: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
                required
              >
                <option value="">Select AM</option>
                {salesList.map((sales) => (
                  <option key={sales.id} value={sales.id}>
                    {sales.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>
          )}

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

