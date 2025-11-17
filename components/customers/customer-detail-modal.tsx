"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

const ACTIVITY_STATUS_COLORS: Record<string, string> = {
  'Planned': 'bg-blue-900 text-blue-200',
  'In Progress': 'bg-yellow-900 text-yellow-200',
  'Selesai': 'bg-green-900 text-green-200',
};

export function CustomerDetailModal({ customer, onClose }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("activities")
          .select("*, activity_types:jenis_aktivitas_id(nama_aktivitas)")
          .eq("customer_id", customer.id)
          .order("tanggal_aktivitas", { ascending: false });
        
        setActivities(data || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [customer.id]);

  const STATUS_COLORS: Record<string, string> = {
    'Lead': 'bg-blue-900 text-blue-200',
    'Follow Up': 'bg-yellow-900 text-yellow-200',
    'Proposal Dikirim': 'bg-purple-900 text-purple-200',
    'Negosiasi': 'bg-orange-900 text-orange-200',
    'Closed Won': 'bg-green-900 text-green-200',
    'Closed Lost': 'bg-red-900 text-red-200',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div>
            <CardTitle className="text-2xl text-slate-900 dark:text-slate-50">{customer.nama_perusahaan}</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              PIC: {customer.nama_pic} ({customer.jabatan_pic})
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Status Pipeline</label>
              <Badge className={STATUS_COLORS[customer.status_pipeline] || 'bg-slate-600 text-slate-200'}>
                {customer.status_pipeline}
              </Badge>
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Phone Number</label>
              <p className="text-slate-900 dark:text-slate-50">{customer.nomor_hp}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Industry</label>
              <p className="text-slate-900 dark:text-slate-50">{customer.industri}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">City</label>
              <p className="text-slate-900 dark:text-slate-50">{customer.kota}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Potential Value</label>
              <p className="text-slate-900 dark:text-slate-50">Rp {customer.nilai_potensial?.toLocaleString('id-ID') || '0'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Lead Source</label>
              <p className="text-slate-900 dark:text-slate-50">{customer.asal_lead}</p>
            </div>
          </div>

          {/* Activities Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Activities ({activities.length})</h3>
            
            {loading ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">Loading activities...</p>
            ) : activities.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No activities found</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                          {(activity.activity_types as any)?.nama_aktivitas || 'Activity'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(activity.tanggal_aktivitas).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge className={ACTIVITY_STATUS_COLORS[activity.status_aktivitas] || 'bg-slate-600 text-slate-200'}>
                        {activity.status_aktivitas}
                      </Badge>
                    </div>
                    {activity.catatan && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                        <span className="text-slate-600 dark:text-slate-400">Notes: </span>
                        {activity.catatan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
