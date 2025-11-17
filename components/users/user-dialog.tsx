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

export function UserDialog({
  user,
  onClose,
  onSave,
}: {
  user: any | null;
  onClose: () => void;
  onSave: (user: any) => void;
}) {
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    email: "",
    role: "Sales",
    gm_id: "",
    status_aktif: true,
    password: "",
  });
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        gm_id: user.gm_id || "",
        status_aktif: user.status_aktif,
        password: "",
      });
    }

    // Load GMs for dropdown
    const loadManagers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("role", "GM");
      setManagers(data || []);
    };

    loadManagers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (user) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("users")
          .update({
            nama_lengkap: formData.nama_lengkap,
            role: formData.role,
            gm_id: formData.gm_id || null,
            status_aktif: formData.status_aktif,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
        onSave({ ...user, ...formData });
      } else {
        // Create new user via auth
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: formData.email,
            password: formData.password || Math.random().toString(36).substring(7),
            options: {
              data: {
                nama_lengkap: formData.nama_lengkap,
                role: formData.role,
              },
            },
          });

        if (signUpError) throw signUpError;

        // Ensure profile row is completed with gm_id and status_aktif
        if (signUpData.user?.id) {
          const { error: profileUpdateError } = await supabase
            .from("users")
            .update({
              nama_lengkap: formData.nama_lengkap,
              role: formData.role,
              gm_id: formData.role === "Sales" ? (formData.gm_id || null) : null,
              status_aktif: formData.status_aktif,
              updated_at: new Date().toISOString(),
            })
            .eq("id", signUpData.user.id);
          if (profileUpdateError) throw profileUpdateError;
        }

        onSave({
          id: signUpData.user?.id,
          ...formData,
        });
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
          <DialogTitle className="text-slate-900 dark:text-slate-50">{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-700 dark:text-slate-300">Full Name</Label>
            <Input
              value={formData.nama_lengkap}
              onChange={(e) =>
                setFormData({ ...formData, nama_lengkap: e.target.value })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              required
            />
          </div>

          {!user && (
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                required
              />
            </div>
          )}

          {!user && (
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Password</Label>
              <Input
                type="password"
                placeholder="Leave empty to auto-generate"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              />
            </div>
          )}

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Role</Label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
            >
              <option value="Sales">Sales</option>
              <option value="GM">General Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {formData.role === "Sales" && (
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Manager (GM)</Label>
              <select
                value={formData.gm_id}
                onChange={(e) =>
                  setFormData({ ...formData, gm_id: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="status_aktif"
              checked={formData.status_aktif}
              onChange={(e) =>
                setFormData({ ...formData, status_aktif: e.target.checked })
              }
              className="rounded"
            />
            <Label htmlFor="status_aktif" className="text-slate-700 dark:text-slate-300">
              Active Status
            </Label>
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
