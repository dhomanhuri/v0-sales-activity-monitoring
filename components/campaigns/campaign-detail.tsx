"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, Filter, X, ArrowUpDown, Globe, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CampaignActivityDialog } from "./campaign-activity-dialog";
import { createClient } from "@/lib/supabase/client";

export function CampaignDetail({ campaign, activities: initialActivities, userRole, userId }: any) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [defaultValues, setDefaultValues] = useState<{
    pic?: string;
    potentialValue?: number;
    customerId?: string;
  }>({});
  const [presalesMap, setPresalesMap] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const canEdit = (userRole === "Admin" || userRole === "GM" || userRole === "GM Non Sales" || campaign.sales_id === userId) && userRole !== "Presales" && userRole !== "Engineer" && userRole !== "Editor";
  const isPresales = userRole === "Presales" || userRole === "Engineer" || userRole === "Editor";

  // Load presales users for mapping IDs to names
  useEffect(() => {
    const loadPresales = async () => {
      const supabase = createClient();
      const { data: presalesData } = await supabase
        .from("users")
        .select("id, nama_lengkap")
        .eq("role", "Presales")
        .eq("status_aktif", true);
      
      const map = new Map<string, string>();
      (presalesData || []).forEach((presales: any) => {
        map.set(presales.id, presales.nama_lengkap);
      });
      setPresalesMap(map);
    };

    loadPresales();
  }, []);

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    return activities.filter((activity: any) => {
      const customerName = (activity.master_customers as any)?.name || "";
      const pic = activity.pic || "";
      const keterangan = activity.keterangan || "";
      const jenisAktivitas = activity.jenis_aktivitas || "";
      
      // Parse presales for search
      let presalesNames = "";
      if (activity.presales) {
        let presalesArray: string[] = [];
        if (Array.isArray(activity.presales)) {
          presalesArray = activity.presales;
        } else if (typeof activity.presales === 'string') {
          try {
            presalesArray = JSON.parse(activity.presales);
          } catch {
            presalesArray = [];
          }
        }
        presalesNames = presalesArray
          .map((id: string) => presalesMap.get(id))
          .filter(Boolean)
          .join(" ");
      }
      
      const matchesSearch = !search || 
        customerName.toLowerCase().includes(search.toLowerCase()) ||
        pic.toLowerCase().includes(search.toLowerCase()) ||
        keterangan.toLowerCase().includes(search.toLowerCase()) ||
        jenisAktivitas.toLowerCase().includes(search.toLowerCase()) ||
        presalesNames.toLowerCase().includes(search.toLowerCase());
      
      const matchesCustomer = !customerFilter || activity.customer_id === customerFilter;
      const matchesActivityType = !activityTypeFilter || activity.jenis_aktivitas === activityTypeFilter;
      
      return matchesSearch && matchesCustomer && matchesActivityType;
    });
  }, [activities, search, customerFilter, activityTypeFilter, presalesMap]);

  // Get unique customers and activity types for filters
  const uniqueCustomers = useMemo(() => {
    const customers = new Map<string, string>();
    activities.forEach((activity: any) => {
      const customerId = activity.customer_id;
      const customerName = (activity.master_customers as any)?.name || 'No Customer';
      if (customerId) {
        customers.set(customerId, customerName);
      }
    });
    return Array.from(customers.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activities]);

  const activityTypes = useMemo(() => {
    const types = new Set<string>();
    activities.forEach((activity: any) => {
      if (activity.jenis_aktivitas) {
        types.add(activity.jenis_aktivitas);
      }
    });
    return Array.from(types).sort();
  }, [activities]);

  // Prepare timeline data for horizontal Gantt-style timeline
  const timelineData = useMemo(() => {
    if (filteredActivities.length === 0) return null;

    // Get min and max dates from activities
    const dates = filteredActivities.map((activity: any) => 
      new Date(activity.tanggal_aktivitas || activity.created_at)
    );
    const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));

    // Set to start of month for min and end of month for max
    const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    // Generate months array
    const months: Array<{ year: number; month: number; startDate: Date; endDate: Date; label: string }> = [];
    const current = new Date(startMonth);
    
    while (current <= endMonth) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      months.push({
        year,
        month,
        startDate: monthStart,
        endDate: monthEnd,
        label: current.toLocaleDateString('en-US', { month: 'short' })
      });
      
      current.setMonth(month + 1);
    }

    // Calculate total days span
    const totalDays = Math.ceil((endMonth.getTime() - startMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const startTime = startMonth.getTime();

    // Prepare activities with position and width
    const timelineActivities = filteredActivities.map((activity: any) => {
      const activityDate = new Date(activity.tanggal_aktivitas || activity.created_at);
      const daysFromStart = Math.ceil((activityDate.getTime() - startTime) / (1000 * 60 * 60 * 24));
      
      // Each activity is represented as a point (single day), but we'll make it a small bar
      const leftPercent = (daysFromStart / totalDays) * 100;
      const widthPercent = Math.max(2, 100 / totalDays); // Minimum 2% width or based on day width

      return {
        ...activity,
        leftPercent,
        widthPercent,
        date: activityDate
      };
    });

    return {
      startDate: startMonth,
      endDate: endMonth,
      totalDays,
      months,
      activities: timelineActivities
    };
  }, [filteredActivities]);

  // Sort and group filtered activities by customer
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, any[]>();
    
    // Sort activities based on sortBy
    const [sortField, sortOrder] = sortBy.split("-");
    const sortedActivities = [...filteredActivities].sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortField) {
        case "date":
          const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
          const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
          // If dates are equal, use created_at as tie-breaker
          if (dateB === dateA) {
            const createdA = new Date(a.created_at || 0).getTime();
            const createdB = new Date(b.created_at || 0).getTime();
            comparison = createdB - createdA;
          } else {
            comparison = dateB - dateA;
          }
          break;
        case "customer":
          const customerA = (a.master_customers as any)?.name || "";
          const customerB = (b.master_customers as any)?.name || "";
          comparison = customerA.localeCompare(customerB);
          break;
        case "type":
          comparison = (a.jenis_aktivitas || "").localeCompare(b.jenis_aktivitas || "");
          break;
        case "value":
          comparison = (parseFloat(a.potential_value) || 0) - (parseFloat(b.potential_value) || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    for (const activity of sortedActivities) {
      const customerId = activity.customer_id || 'no-customer';
      const customerName = (activity.master_customers as any)?.name || 'No Customer';
      
      if (!groups.has(customerId)) {
        groups.set(customerId, []);
      }
      groups.get(customerId)!.push(activity);
    }
    
    // Sort groups by customer name if needed
    const sortedGroups = Array.from(groups.entries()).map(([customerId, activities]) => ({
      customerId,
      customerName: activities[0]?.master_customers?.name || 'No Customer',
      activities,
    }));

    // Sort groups by customer name if sorting by customer
    if (sortField === "customer") {
      sortedGroups.sort((a, b) => {
        const comparison = a.customerName.localeCompare(b.customerName);
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }
    
    return sortedGroups;
  }, [filteredActivities, sortBy]);

  const hasActiveFilters = customerFilter || activityTypeFilter;

  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const handleActivitySaved = async (updatedActivity: any) => {
    if (editingActivity) {
      setActivities(activities.map((a: any) => a.id === updatedActivity.id ? updatedActivity : a));
      setEditingActivity(null);
    } else {
      setActivities([updatedActivity, ...activities]);
    }
    setShowDialog(false);
    // Refresh the page to get latest data from server
    router.refresh();
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaign_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
      setActivities(activities.filter((a: any) => a.id !== activityId));
    } catch (err: any) {
      alert("Failed to delete activity: " + err.message);
    }
  };

  // Potential Revenue adalah akumulasi Potential Leads terakhir tiap customer
  // Group activities by customer_id, ambil yang terakhir per customer, lalu jumlahkan
  const potentialRevenue = (() => {
    const customerLatestActivity = new Map<string, any>();
    
    // Sort activities by tanggal_aktivitas descending
    const sortedActivities = [...activities].sort((a: any, b: any) => {
      const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
      const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
      return dateB - dateA;
    });
    
    // For each activity, keep only the latest one per customer
    for (const activity of sortedActivities) {
      const customerId = activity.customer_id;
      if (customerId && !customerLatestActivity.has(customerId)) {
        customerLatestActivity.set(customerId, activity);
      }
    }
    
    // Sum all potential_value from latest activities per customer
    let total = 0;
    for (const activity of customerLatestActivity.values()) {
      total += parseFloat(activity.potential_value) || 0;
    }
    
    return total;
  })();
  
  // Get latest activity for display (first activity in sorted list)
  const latestActivity = activities.length > 0 ? activities[0] : null;

  // Achievement Revenue adalah total dari semua aktivitas Closing
  const achievementRevenue = activities
    .filter((act: any) => act.jenis_aktivitas === "Closing")
    .reduce((sum: number, act: any) => 
      sum + (parseFloat(act.potential_value) || 0), 0
    );

  return (
    <div className="p-8 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            // Get sales_id from campaign to go back to sales detail
            router.push(`/dashboard/campaigns/sales/${campaign.sales_id}`);
          }}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {(campaign.master_campaigns as any)?.name}
          </h1>
          {(campaign.master_campaigns as any)?.description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">
              {(campaign.master_campaigns as any)?.description}
            </p>
          )}
          
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Target Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
              Rp {(campaign.target_revenue || 0).toLocaleString('id-ID')}
            </p>
            <div className="h-1 w-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mt-2"></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800 border-blue-200 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">Potential Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              Rp {potentialRevenue.toLocaleString('id-ID')}
            </p>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-2"></div>
          </CardContent>
        </Card>
        {!isPresales && (
          <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-slate-800 border-green-200 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-600 dark:text-green-400 text-xs font-semibold uppercase tracking-wider">Achievement Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                Rp {achievementRevenue.toLocaleString('id-ID')}
              </p>
              <div className="h-1 w-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full mt-2"></div>
            </CardContent>
          </Card>
        )}
        {!isPresales && (
          <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-slate-800 border-purple-200 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider">Achievement Rate (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3">
                {campaign.target_revenue ? 
                  `${((achievementRevenue / campaign.target_revenue) * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </p>
              {campaign.target_revenue && (
                <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min((achievementRevenue / campaign.target_revenue) * 100, 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-transparent dark:from-slate-800 dark:to-transparent pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-xl font-bold">Campaign Activities</CardTitle>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingActivity(null);
                  setDefaultValues({});
                  setShowDialog(true);
                }}
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Globe className="h-4 w-4" />
                Add Activity
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search by customer, PIC, activity type, description, or presales..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`border-slate-200 dark:border-slate-600 ${hasActiveFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                    {[customerFilter, activityTypeFilter].filter(Boolean).length}
                  </span>
                )}
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50"
              >
                <option value="date-desc">Sort: Date (Newest First)</option>
                <option value="date-asc">Sort: Date (Oldest First)</option>
                <option value="customer-asc">Sort: Customer (A-Z)</option>
                <option value="customer-desc">Sort: Customer (Z-A)</option>
                <option value="type-asc">Sort: Activity Type (A-Z)</option>
                <option value="type-desc">Sort: Activity Type (Z-A)</option>
                <option value="value-desc">Sort: Potential Leads (High-Low)</option>
                <option value="value-asc">Sort: Potential Leads (Low-High)</option>
              </select>
            </div>
            {showFilters && (
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Customer
                  </label>
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
                  >
                    <option value="">All Customers</option>
                    {uniqueCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Activity Type
                  </label>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50"
                  >
                    <option value="">All Types</option>
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomerFilter("");
                      setActivityTypeFilter("");
                    }}
                    className="border-red-200 dark:border-red-600 text-red-600 dark:text-red-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showDialog && (
            <CampaignActivityDialog
              activity={editingActivity}
              campaignId={campaign.id}
              onClose={() => {
                setShowDialog(false);
                setEditingActivity(null);
                setDefaultValues({});
              }}
              onSave={handleActivitySaved}
              defaultPic={defaultValues.pic}
              defaultPotentialValue={defaultValues.potentialValue}
              defaultCustomerId={defaultValues.customerId}
            />
          )}

          {groupedActivities.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">
              {activities.length === 0 ? "No activities found" : "No activities match your search/filter"}
            </p>
          ) : (
            <div className="space-y-3">
              {groupedActivities.map((group) => {
                const isExpanded = expandedCustomers.has(group.customerId);
                const activityCount = group.activities.length;
                
                // Get Potential Leads from the latest activity for this customer
                // Activities are already sorted by tanggal_aktivitas descending in groupedActivities
                const latestActivity = group.activities.length > 0 ? group.activities[0] : null;
                const potentialValue = latestActivity ? (parseFloat(latestActivity.potential_value) || 0) : 0;
                
                // Calculate achievement revenue (sum of all Closing activities for this customer)
                const achievementRevenue = group.activities
                  .filter((act: any) => act.jenis_aktivitas === "Closing")
                  .reduce((sum: number, act: any) => sum + (parseFloat(act.potential_value) || 0), 0);
                
                return (
                  <div
                    key={group.customerId}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {/* Customer Header */}
                    <div className="w-full p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-700 hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-600 dark:hover:to-slate-600 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleCustomer(group.customerId)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                              {group.customerName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                              </p>
                              {potentialValue > 0 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Potential Leads: Rp {potentialValue.toLocaleString('id-ID')}
                                </span>
                              )}
                              {!isPresales && achievementRevenue > 0 && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Achievement Revenue: Rp {achievementRevenue.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                        {canEdit && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Get latest activity data for this customer (first activity in sorted list)
                              const latest = group.activities.length > 0 ? group.activities[0] : null;
                              setDefaultValues({
                                pic: latest?.pic || "",
                                potentialValue: latest ? (parseFloat(latest.potential_value) || 0) : 0,
                                customerId: group.customerId,
                              });
                              setEditingActivity(null);
                              setShowDialog(true);
                            }}
                            className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Users className="h-4 w-4" />
                            Add Activity
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Activities List */}
                    {isExpanded && (
                      <div className="bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-800 dark:to-slate-800 border-t border-slate-200 dark:border-slate-600">
                        <div className="p-4 space-y-3">
                          {group.activities.map((activity: any) => (
                            <div
                              key={activity.id}
                              className="p-4 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                                      {activity.jenis_aktivitas}
                                    </h4>
                                    {activity.potential_value && (
                                      <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                        Rp {activity.potential_value.toLocaleString('id-ID')}
                                      </span>
                                    )}
                                  </div>
                                  {activity.pic && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                      PIC: <span className="font-medium text-slate-700 dark:text-slate-300">{activity.pic}</span>
                                    </p>
                                  )}
                                  {(() => {
                                    // Parse presales from JSONB array
                                    let presalesArray: string[] = [];
                                    if (activity.presales) {
                                      if (Array.isArray(activity.presales)) {
                                        presalesArray = activity.presales;
                                      } else if (typeof activity.presales === 'string') {
                                        try {
                                          presalesArray = JSON.parse(activity.presales);
                                        } catch {
                                          presalesArray = [];
                                        }
                                      }
                                    }
                                    
                                    if (presalesArray.length > 0) {
                                      const presalesNames = presalesArray
                                        .map((id: string) => presalesMap.get(id))
                                        .filter(Boolean);
                                      
                                      if (presalesNames.length > 0) {
                                        return (
                                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            Presales: <span className="font-medium text-slate-700 dark:text-slate-300">
                                              {presalesNames.join(", ")}
                                            </span>
                                          </p>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
                                  {activity.keterangan && (
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                      {activity.keterangan}
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Date: {new Date(activity.tanggal_aktivitas || activity.created_at).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                {canEdit && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingActivity(activity);
                                        setShowDialog(true);
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gantt Chart Timeline Design */}
      {timelineData && filteredActivities.length > 0 && (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden" style={{ width: 'calc(85vw - 4rem)', maxWidth: 'calc(100vw - 4rem)' }}>
          <CardHeader className="bg-gradient-to-r from-orange-50/50 via-blue-50/30 to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 pb-4 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-xl font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-blue-500 rounded-full"></div>
              Activity Timeline
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Gantt chart view of campaign activities
            </p>
          </CardHeader>
          <CardContent className="p-0 w-full overflow-hidden">
            <div className="overflow-x-auto" style={{ width: '100%' }}>
              {(() => {
                // Generate all days in the timeline range
                const allDays: Array<{ date: Date; dayOfWeek: number; isWeekend: boolean }> = [];
                const current = new Date(timelineData.startDate);
                
                while (current <= timelineData.endDate) {
                  const dayOfWeek = current.getDay();
                  allDays.push({
                    date: new Date(current),
                    dayOfWeek,
                    isWeekend: dayOfWeek === 0 || dayOfWeek === 6
                  });
                  current.setDate(current.getDate() + 1);
                }
                
                // Group activities by customer
                const activitiesByCustomer = new Map<string, any[]>();
                timelineData.activities.forEach((activity: any) => {
                  const customerId = activity.customer_id || 'no-customer';
                  const customerName = (activity.master_customers as any)?.name || 'No Customer';
                  const key = `${customerId}|${customerName}`;
                  
                  if (!activitiesByCustomer.has(key)) {
                    activitiesByCustomer.set(key, []);
                  }
                  activitiesByCustomer.get(key)!.push(activity);
                });
                
                const colors = [
                  { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-700 dark:text-green-300', circle: 'bg-green-500' },
                  { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-700 dark:text-orange-300', circle: 'bg-orange-500' },
                  { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-700 dark:text-blue-300', circle: 'bg-blue-500' },
                  { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-700 dark:text-purple-300', circle: 'bg-purple-500' },
                  { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-pink-700 dark:text-pink-300', circle: 'bg-pink-500' },
                  { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-700 dark:text-indigo-300', circle: 'bg-indigo-500' },
                ];
                
                // Calculate minimum width based on number of days
                const minWidth = Math.max(800, allDays.length * 60 + 256); // 256px for sidebar, 60px per day
                
                return (
                  <div style={{ minWidth: `${minWidth}px`, width: 'max-content' }}>
                    {/* Calendar Header */}
                    <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-600 shadow-sm">
                      <div className="flex">
                        {/* Left sidebar for task names - sticky */}
                        <div className="sticky left-0 z-40 w-64 border-r-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-3 font-semibold text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                          Task
                        </div>
                      
                      {/* Calendar days */}
                      <div className="flex-1 flex">
                        {allDays.map((day, idx) => {
                          const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day.dayOfWeek];
                          const dateLabel = day.date.getDate();
                          const isToday = day.date.toDateString() === new Date().toDateString();
                          
                          return (
                            <div
                              key={idx}
                              className={`flex-1 min-w-[60px] border-r border-slate-200 dark:border-slate-700 ${
                                day.isWeekend ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'
                              } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                              <div className="text-center py-2 border-b border-slate-200 dark:border-slate-700">
                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {dayLabel}
                                </div>
                                <div className={`text-sm font-bold mt-1 ${
                                  isToday 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-slate-900 dark:text-slate-50'
                                }`}>
                                  {dateLabel}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Rows */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {Array.from(activitiesByCustomer.entries()).map(([customerKey, customerActivities], customerIndex) => {
                      const [, customerName] = customerKey.split('|');
                      const color = colors[customerIndex % colors.length];
                      
                      return (
                        <div key={customerKey} className="group">
                          {/* Customer Header */}
                          <div className="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="w-64 border-r-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-3 flex items-center gap-2">
                              <div className={`w-1 h-6 ${color.bg} rounded-full`}></div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                {customerName}
                              </div>
                            </div>
                            <div className="flex-1 flex">
                              {allDays.map((day, idx) => (
                                <div
                                  key={idx}
                                  className={`flex-1 min-w-[60px] border-r border-slate-200 dark:border-slate-700 ${
                                    day.isWeekend ? 'bg-slate-100 dark:bg-slate-800/50' : ''
                                  }`}
                                ></div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Activities for this customer */}
                          {customerActivities
                            .sort((a: any, b: any) => {
                              const dateA = new Date(a.tanggal_aktivitas || a.created_at).getTime();
                              const dateB = new Date(b.tanggal_aktivitas || b.created_at).getTime();
                              return dateA - dateB;
                            })
                            .map((activity: any, activityIndex: number) => {
                              const activityDate = new Date(activity.tanggal_aktivitas || activity.created_at);
                              const dayIndex = allDays.findIndex(d => 
                                d.date.toDateString() === activityDate.toDateString()
                              );
                              
                              // Get PIC initials
                              const pic = activity.pic || '';
                              const picInitials = pic
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) || '?';
                              
                              return (
                                <div
                                  key={activity.id}
                                  className="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setEditingActivity(activity);
                                    setShowDialog(true);
                                  }}
                                >
                                  {/* Task name column - sticky */}
                                  <div className="sticky left-0 z-10 w-64 border-r-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 flex items-center gap-3 shadow-sm">
                                    <div className={`w-8 h-8 ${color.circle} rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-800 shadow-sm`}>
                                      {picInitials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-semibold ${color.text} truncate`}>
                                        {activity.jenis_aktivitas}
                                      </div>
                                      {activity.pic && (
                                        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                          {activity.pic}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Timeline bars */}
                                  <div className="flex-1 flex relative">
                                    {allDays.map((day, idx) => {
                                      const isActivityDay = idx === dayIndex;
                                      const isToday = day.date.toDateString() === new Date().toDateString();
                                      
                                      return (
                                        <div
                                          key={idx}
                                          className={`flex-1 min-w-[60px] border-r border-slate-200 dark:border-slate-700 relative ${
                                            day.isWeekend ? 'bg-slate-100 dark:bg-slate-800/50' : ''
                                          } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        >
                                          {isActivityDay && (
                                            <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                                              <div
                                                className={`h-8 ${color.bg} ${color.border} border-2 rounded-lg shadow-md flex items-center justify-between px-2 mx-1 group-hover:shadow-lg transition-all cursor-pointer`}
                                                title={`${activity.jenis_aktivitas}\n${customerName}\n${activityDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
                                              >
                                                <span className="text-xs font-bold text-white">
                                                  1d
                                                </span>
                                                {activity.potential_value && (
                                                  <span className="text-xs font-semibold text-white/90">
                                                    Rp {parseFloat(activity.potential_value).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

