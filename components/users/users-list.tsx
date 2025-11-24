"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserDialog } from "./user-dialog";
import { Plus, Search, Trash2 } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

export function UsersList({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUserSaved = async (updatedUser: any) => {
    // Refresh user data to get latest avatar_url
    const supabase = createClient();
    const { data: freshUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", updatedUser.id)
      .single();

    if (editingUser) {
      setUsers(users.map(u => u.id === updatedUser.id ? (freshUser || updatedUser) : u));
      setEditingUser(null);
    } else {
      setUsers([freshUser || updatedUser, ...users]);
    }
    setShowDialog(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="GM">General Manager</option>
          <option value="Sales">Sales</option>
          <option value="Presales">Presales</option>
          <option value="Engineer">Engineer</option>
        </select>
        <Button
          onClick={() => {
            setEditingUser(null);
            setShowDialog(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {showDialog && (
        <UserDialog
          user={editingUser}
          onClose={() => {
            setShowDialog(false);
            setEditingUser(null);
          }}
          onSave={handleUserSaved}
        />
      )}

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Photo</th>
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Name</th>
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Email</th>
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Role</th>
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Department</th>
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-right py-3 px-4 text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="py-3 px-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} alt={user.nama_lengkap} />
                          <AvatarFallback>
                            {user.nama_lengkap
                              ? user.nama_lengkap
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-50">{user.nama_lengkap}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            user.role === "Admin"
                              ? "bg-red-900 text-red-200"
                              : user.role === "GM"
                              ? "bg-blue-900 text-blue-200"
                              : user.role === "Presales"
                              ? "bg-purple-900 text-purple-200"
                              : user.role === "Engineer"
                              ? "bg-purple-900 text-purple-200"
                              : "bg-green-900 text-green-200"
                          }
                        >
                          {user?.role=="Sales" ? "AM" : user?.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {user.role === "GM" ? (user.department || "-") : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            user.status_aktif
                              ? "bg-green-900 text-green-200"
                              : "bg-gray-900 text-gray-200"
                          }
                        >
                          {user.status_aktif ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right gap-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setShowDialog(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
