"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function SalesDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    plannedToday: 0,
    plannedThisWeek: 0,
    pipelineStats: [] as any[],
    upcomingActivities: [] as any[],
    recentActivities: [] as any[],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClient();

      // Get total customers
      const { data: customers } = await supabase
        .from("customers")
        .select("status_pipeline")
        .eq("sales_id", userId);

      // Calculate pipeline stats
      const pipelineStats = [
        { name: 'Lead', value: customers?.filter(c => c.status_pipeline === 'Lead').length || 0 },
        { name: 'Proposal', value: customers?.filter(c => c.status_pipeline === 'Proposal Dikirim').length || 0 },
        { name: 'Negosiasi', value: customers?.filter(c => c.status_pipeline === 'Negosiasi').length || 0 },
        { name: 'Closed Won', value: customers?.filter(c => c.status_pipeline === 'Closed Won').length || 0 },
        { name: 'Closed Lost', value: customers?.filter(c => c.status_pipeline === 'Closed Lost').length || 0 },
      ];

      // Get recent activities
      const { data: activities } = await supabase
        .from("activities")
        .select(`
          *,
          customers:customer_id(nama_perusahaan),
          activity_types:jenis_aktivitas_id(nama_aktivitas)
        `)
        .eq("sales_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalCustomers: customers?.length || 0,
        plannedToday: 0,
        plannedThisWeek: 0,
        pipelineStats,
        upcomingActivities: [],
        recentActivities: activities || [],
      });
    };

    loadDashboard();
  }, [userId]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Aktivitas Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">0</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">0</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Closed Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">
              {stats.pipelineStats.find(s => s.name === 'Closed Won')?.value || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50">Distribusi Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.pipelineStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color) => (
                    <Cell key={`cell-${color}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.pipelineStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentActivities.length === 0 ? (
              <p className="text-slate-400">Tidak ada aktivitas terbaru</p>
            ) : (
              stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700 border border-slate-600"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-50">
                      {(activity.customers as any)?.nama_perusahaan}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(activity.activity_types as any)?.nama_aktivitas}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(activity.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
