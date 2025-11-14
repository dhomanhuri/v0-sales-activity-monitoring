"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomerDialog } from "./customer-dialog";
import { Plus, Search, Eye } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Lead': 'bg-blue-900 text-blue-200',
  'Follow Up': 'bg-yellow-900 text-yellow-200',
  'Proposal Dikirim': 'bg-purple-900 text-purple-200',
  'Negosiasi': 'bg-orange-900 text-orange-200',
  'Closed Won': 'bg-green-900 text-green-200',
  'Closed Lost': 'bg-red-900 text-red-200',
};

export function CustomersList({ initialCustomers, userRole, userId }: any) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.nama_perusahaan.toLowerCase().includes(search.toLowerCase()) ||
      customer.nama_pic.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || customer.status_pipeline === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCustomerSaved = (updatedCustomer: any) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      setEditingCustomer(null);
    } else {
      setCustomers([updatedCustomer, ...customers]);
    }
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Cari customer..."
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
          <option value="Lead">Lead</option>
          <option value="Follow Up">Follow Up</option>
          <option value="Proposal Dikirim">Proposal Dikirim</option>
          <option value="Negosiasi">Negosiasi</option>
          <option value="Closed Won">Closed Won</option>
          <option value="Closed Lost">Closed Lost</option>
        </select>
        <Button
          onClick={() => {
            setEditingCustomer(null);
            setShowDialog(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Customer
        </Button>
      </div>

      {showDialog && (
        <CustomerDialog
          customer={editingCustomer}
          onClose={() => {
            setShowDialog(false);
            setEditingCustomer(null);
          }}
          onSave={handleCustomerSaved}
          userRole={userRole}
          userId={userId}
        />
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          {filteredCustomers.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Tidak ada customer ditemukan</p>
          ) : (
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 rounded-lg bg-slate-700 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-50">{customer.nama_perusahaan}</h3>
                        <Badge className={STATUS_COLORS[customer.status_pipeline] || 'bg-slate-600 text-slate-200'}>
                          {customer.status_pipeline}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        PIC: {customer.nama_pic} ({customer.jabatan_pic}) | {customer.nomor_hp}
                      </p>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>Industri: {customer.industri}</span>
                        <span>Potensi: Rp {customer.nilai_potensial?.toLocaleString('id-ID') || '0'}</span>
                        <span>Kota: {customer.kota}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCustomer(customer);
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
