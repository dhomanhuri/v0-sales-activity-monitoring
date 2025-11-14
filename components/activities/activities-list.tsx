"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActivityDialog } from "./activity-dialog";
import { Plus, Search } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Planned': 'bg-blue-900 text-blue-200',
  'In Progress': 'bg-yellow-900 text-yellow-200',
  'Selesai': 'bg-green-900 text-green-200',
};

export function ActivitiesList({ initialActivities, userRole, userId }: any) {
  const [activities, setActivities] = useState(initialActivities);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      (activity.customers as any)?.nama_perusahaan.toLowerCase().includes(search.toLowerCase()) ||
      (activity.activity_types as any)?.nama_aktivitas.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || activity.status_aktivitas === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleActivitySaved = (updatedActivity: any) => {
    if (editingActivity) {
      setActivities(activities.map(a => a.id === updatedActivity.id ? updatedActivity : a));
      setEditingActivity(null);
    } else {
      setActivities([updatedActivity, ...activities]);
    }
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Cari aktivitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-50"
        >
          <option value="">Semua Status</option>
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Selesai">Selesai</option>
        </select>
        <Button
          onClick={() => {
            setEditingActivity(null);
            setShowDialog(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Aktivitas
        </Button>
      </div>

      {showDialog && (
        <ActivityDialog
          activity={editingActivity}
          onClose={() => {
            setShowDialog(false);
            setEditingActivity(null);
          }}
          onSave={handleActivitySaved}
          userId={userId}
        />
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          {filteredActivities.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Tidak ada aktivitas ditemukan</p>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-lg bg-slate-700 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-50">
                          {(activity.customers as any)?.nama_perusahaan}
                        </h3>
                        <Badge className={STATUS_COLORS[activity.status_aktivitas] || 'bg-slate-600 text-slate-200'}>
                          {activity.status_aktivitas}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        Aktivitas: {(activity.activity_types as any)?.nama_aktivitas}
                      </p>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>Tanggal: {new Date(activity.tanggal_aktivitas).toLocaleDateString('id-ID')}</span>
                        {activity.catatan && <span>Catatan: {activity.catatan}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingActivity(activity);
                        setShowDialog(true);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
