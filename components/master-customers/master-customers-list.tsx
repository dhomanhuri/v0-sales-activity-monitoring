"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { MasterCustomerDialog } from "./master-customer-dialog";

export function MasterCustomersList({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustomerSaved = (updatedCustomer: any) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      setEditingCustomer(null);
    } else {
      setCustomers([updatedCustomer, ...customers]);
    }
    setShowDialog(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Yakin ingin menghapus customer ini?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("master_customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;
      setCustomers(customers.filter(c => c.id !== customerId));
    } catch (err: any) {
      alert("Gagal menghapus customer: " + err.message);
    }
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
        <MasterCustomerDialog
          customer={editingCustomer}
          onClose={() => {
            setShowDialog(false);
            setEditingCustomer(null);
          }}
          onSave={handleCustomerSaved}
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
                      <h3 className="font-semibold text-slate-50 mb-1">
                        {customer.name}
                      </h3>
                      {customer.description && (
                        <p className="text-sm text-slate-400">
                          {customer.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setShowDialog(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

