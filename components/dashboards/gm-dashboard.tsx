"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GMDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Performa Tim</CardTitle>
          <CardDescription className="text-slate-400">Monitoring performa penjualan tim Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">Dashboard GM akan menampilkan performa semua sales di bawah Anda</p>
        </CardContent>
      </Card>
    </div>
  );
}
