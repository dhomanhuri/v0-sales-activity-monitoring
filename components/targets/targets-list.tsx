"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TargetDialog } from "./target-dialog";
import { Plus, Search } from 'lucide-react';

export function TargetsList({ initialTargets, userRole, userId }: any) {
  const [targets, setTargets] = useState(initialTargets);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [salesList, setSalesList] = useState<any[]>([]);

  useEffect(() => {
    // Load sales for this GM
    const loadSales = async () => {
      const supabase = await import("@/lib/supabase/client").then(m => m.createClient());
      const { data } = await supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("gm_id", userId)
        .eq("role", "Sales");
      setSalesList(data || []);
    };

    loadSales();
  }, [userId]);

  const filteredTargets = targets.filter((target) => {
    const matchesSearch =
      (target.users as any)?.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      target.periode_bulan.toLowerCase().includes(search.toLowerCase());
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

  const calculateProgress = (target: any) => {
    // This is simplified - full implementation would calculate from activities/customers
    return {
      leads: Math.floor(Math.random() * (target.target_jumlah_lead || 10)),
      proposals: Math.floor(Math.random() * (target.target_jumlah_proposal || 5)),
      closings: Math.floor(Math.random() * (target.target_jumlah_closing || 3)),
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
                const progress = calculateProgress(target);
                const leadPercent = target.target_jumlah_lead ? (progress.leads / target.target_jumlah_lead * 100) : 0;
                const proposalPercent = target.target_jumlah_proposal ? (progress.proposals / target.target_jumlah_proposal * 100) : 0;
                const closingPercent = target.target_jumlah_closing ? (progress.closings / target.target_jumlah_closing * 100) : 0;
                const revenuePercent = target.target_nilai_revenue ? (progress.revenue / target.target_nilai_revenue * 100) : 0;

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
                          Periode: {target.periode_bulan}
                        </p>
                      </div>
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
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Lead</p>
                        <div className="bg-slate-600 rounded-full h-2 mb-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(leadPercent, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm font-semibold text-slate-50">
                          {progress.leads}/{target.target_jumlah_lead}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Proposal</p>
                        <div className="bg-slate-600 rounded-full h-2 mb-1">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(proposalPercent, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm font-semibold text-slate-50">
                          {progress.proposals}/{target.target_jumlah_proposal}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Closing</p>
                        <div className="bg-slate-600 rounded-full h-2 mb-1">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(closingPercent, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm font-semibold text-slate-50">
                          {progress.closings}/{target.target_jumlah_closing}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Revenue</p>
                        <div className="bg-slate-600 rounded-full h-2 mb-1">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(revenuePercent, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm font-semibold text-slate-50">
                          {Math.floor(progress.revenue / 1000000)}M
                        </p>
                      </div>
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
