"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Overview Sistem</CardTitle>
          <CardDescription className="text-slate-400">Ringkasan keseluruhan sistem penjualan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">Dashboard Admin akan menampilkan statistik global sistem</p>
        </CardContent>
      </Card>
    </div>
  );
}
