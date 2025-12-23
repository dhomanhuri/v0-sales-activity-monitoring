"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Target, Calendar } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

export function ActivityTargetDialog({
  campaign,
  salesId,
  salesName,
  onClose,
  onSave,
  existingTarget,
}: {
  campaign: any;
  salesId: string;
  salesName: string;
  onClose: () => void;
  onSave: () => void;
  existingTarget?: any;
}) {
  const [formData, setFormData] = useState({
    jenis_aktivitas: existingTarget?.jenis_aktivitas || "Initiate Call",
    target_date: existingTarget?.target_date 
      ? new Date(existingTarget.target_date).toISOString().split('T')[0]
      : "",
    notes: existingTarget?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    "Initiate Call",
    "Presentation",
    "Demo",
    "POC",
    "Tender",
    "Negotiation",
    "Closing",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_date) {
      alert("Please select a target date");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: gmProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!gmProfile) throw new Error("GM profile not found");

      const targetData = {
        campaign_id: campaign.id,
        sales_id: salesId,
        gm_id: gmProfile.id,
        jenis_aktivitas: formData.jenis_aktivitas,
        target_date: formData.target_date,
        notes: formData.notes || null,
      };

      if (existingTarget) {
        // Update existing target
        const { error } = await supabase
          .from("activity_targets")
          .update(targetData)
          .eq("id", existingTarget.id);

        if (error) throw error;
      } else {
        // Insert new target
        const { error } = await supabase
          .from("activity_targets")
          .insert(targetData);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err: any) {
      alert("Failed to save target: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {existingTarget ? "Edit" : "Set"} Activity Target
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {salesName} - {(campaign.master_campaigns as any)?.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Label className="text-slate-700 dark:text-slate-300 mb-2 block">
              Activity Type*
            </Label>
            <select
              value={formData.jenis_aktivitas}
              onChange={(e) =>
                setFormData({ ...formData, jenis_aktivitas: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
              required
            >
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Target Date*
            </Label>
            <Input
              type="date"
              value={formData.target_date}
              onChange={(e) =>
                setFormData({ ...formData, target_date: e.target.value })
              }
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              required
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300 mb-2 block">
              Notes (Optional)
            </Label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 resize-none"
              placeholder="Add any additional notes or instructions..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-200 dark:border-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white"
            >
              {loading ? "Saving..." : existingTarget ? "Update Target" : "Set Target"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

