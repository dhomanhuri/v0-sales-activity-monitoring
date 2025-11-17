"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Trash2 } from 'lucide-react';

export function ActivityTypesList({ initialTypes }: any) {
  const [types, setTypes] = useState(initialTypes);
  const [showDialog, setShowDialog] = useState(false);
  const [namaAktivitas, setNamaAktivitas] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: newType, error: insertError } = await supabase
        .from("activity_types")
        .insert({ nama_aktivitas: namaAktivitas })
        .select()
        .single();

      if (insertError) throw insertError;
      setTypes([...types, newType]);
      setNamaAktivitas("");
      setShowDialog(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity type?")) return;

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      setTypes(types.filter((t: any) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Button
          onClick={() => setShowDialog(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Activity Type
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50">
          <DialogHeader>
            <DialogTitle>Add Activity Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label className="text-slate-300">Activity Name*</Label>
              <Input
                value={namaAktivitas}
                onChange={(e) => setNamaAktivitas(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-50"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          {types.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No activity types</p>
          ) : (
            <div className="space-y-2">
              {types.map((type: any) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700 border border-slate-600"
                >
                  <span className="text-slate-50">{type.nama_aktivitas}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(type.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
