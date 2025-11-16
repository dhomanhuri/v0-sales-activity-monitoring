"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TargetDialog } from "./target-dialog";
import { Plus, Search, Trash2 } from 'lucide-react';

export function TargetsList({ initialTargets, userRole, userId }: any) {
  const [targets, setTargets] = useState(initialTargets);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [salesList, setSalesList] = useState<any[]>([]);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        let query = supabase
          .from("users")
          .select("id, nama_lengkap")
          .eq("role", "Sales");
        
        // If GM, only load their own sales team (sales where gm_id matches)
        if (userRole === "GM") {
          query = query.eq("gm_id", userId);
        }
        // If Admin, load all sales users
        
        const { data, error } = await query;
        
        if (error) {
          console.log("[v0] Error loading sales:", error);
        } else {
          console.log("[v0] Loaded sales:", data);
          setSalesList(data || []);
        }
      } catch (error) {
        console.log("[v0] Failed to load sales list:", error);
      }
    };

    loadSales();
  }, [userId, userRole]);

  const filteredTargets = targets.filter((target) => {
    const matchesSearch =
      (target.users as any)?.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      target.periode_tahun.toString().includes(search);
    return matchesSearch;
  });

  const handleTargetSaved = (updatedTarget: any) => {
    if (editingTarget) {
      setTargets(targets.map(t => t.id === updatedTarget.id ? updatedTarget : t));
      setEditingTarget(null);
    } else {
      setTargets([updatedTarget, ...targets]);
    }
    setShowDialog(false);
  };

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm("Yakin ingin menghapus target ini?")) return;

    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { error } = await supabase
        .from("targets")
        .delete()
        .eq("id", targetId);

      if (error) throw error;
      setTargets(targets.filter(t => t.id !== targetId));
    } catch (err: any) {
      alert("Gagal menghapus target: " + err.message);
    }
  };

  const calculateProgress = (target: any) => {
    return {
      revenue: Math.floor(Math.random() * (target.target_nilai_revenue || 100000000)),
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Cari target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-50"
          />
        </div>
        <Button
          onClick={() => {
            setEditingTarget(null);
            setShowDialog(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Target
        </Button>
      </div>

      {showDialog && (
        <TargetDialog
          target={editingTarget}
          onClose={() => {
            setShowDialog(false);
            setEditingTarget(null);
          }}
          onSave={handleTargetSaved}
          userId={userId}
          salesList={salesList}
        />
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          {filteredTargets.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Tidak ada target ditemukan</p>
          ) : (
            <div className="space-y-4">
              {filteredTargets.map((target) => {
                const revenuePercent = target.target_nilai_revenue ? (target.actual_revenue / target.target_nilai_revenue * 100) : 0;

                return (
                  <div
                    key={target.id}
                    className="p-4 rounded-lg bg-slate-700 border border-slate-600"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-50">
                          {(target.users as any)?.nama_lengkap}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Periode: {target.periode_tahun}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTarget(target);
                            setShowDialog(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTarget(target.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-2">Target Revenue</p>
                      <div className="bg-slate-600 rounded-full h-2 mb-1">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(revenuePercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-50">
                        Rp {(target.target_nilai_revenue || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
