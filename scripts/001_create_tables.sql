-- Create tables for Sales Activity Monitoring system
-- This script sets up the complete database schema with RLS policies

-- Users/Profiles table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'GM', 'Sales')),
  gm_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Potential Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_perusahaan TEXT NOT NULL,
  nama_pic TEXT NOT NULL,
  jabatan_pic TEXT,
  email_pic TEXT,
  nomor_hp TEXT,
  industri TEXT,
  asal_lead TEXT,
  nilai_potensial NUMERIC(15, 2),
  status_pipeline TEXT NOT NULL CHECK (status_pipeline IN ('Lead', 'Follow Up', 'Proposal Dikirim', 'Negosiasi', 'Closed Won', 'Closed Lost')),
  kota TEXT,
  catatan TEXT,
  sales_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity Types master data
CREATE TABLE IF NOT EXISTS public.activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_aktivitas TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sales Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES public.users(id),
  jenis_aktivitas_id UUID NOT NULL REFERENCES public.activity_types(id),
  tanggal_aktivitas DATE NOT NULL,
  status_aktivitas TEXT NOT NULL CHECK (status_aktivitas IN ('Planned', 'In Progress', 'Selesai')),
  catatan TEXT,
  next_step TEXT,
  lampiran_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sales Targets table
CREATE TABLE IF NOT EXISTS public.targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id UUID NOT NULL REFERENCES public.users(id),
  gm_id UUID NOT NULL REFERENCES public.users(id),
  periode_bulan TEXT NOT NULL,
  target_jumlah_lead INTEGER,
  target_jumlah_proposal INTEGER,
  target_jumlah_closing INTEGER,
  target_nilai_revenue NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sales_id, periode_bulan)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON public.users FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- RLS Policies for customers table
CREATE POLICY "Sales see own customers" ON public.customers FOR SELECT USING (sales_id = auth.uid());
CREATE POLICY "GMs see their team customers" ON public.customers FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'GM' AND 
    sales_id IN (SELECT id FROM public.users WHERE gm_id = auth.uid()))
);
CREATE POLICY "Admins see all customers" ON public.customers FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Sales can insert own customers" ON public.customers FOR INSERT WITH CHECK (sales_id = auth.uid());
CREATE POLICY "GMs can insert for their team" ON public.customers FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'GM' AND 
    sales_id IN (SELECT id FROM public.users WHERE gm_id = auth.uid()))
);
CREATE POLICY "Admins can insert customers" ON public.customers FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- RLS Policies for activity_types (readable by all authenticated users)
CREATE POLICY "All authenticated users can view activity types" ON public.activity_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity types" ON public.activity_types FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admins can delete activity types" ON public.activity_types FOR DELETE USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- RLS Policies for activities table
CREATE POLICY "Sales see own activities" ON public.activities FOR SELECT USING (sales_id = auth.uid());
CREATE POLICY "GMs see their team activities" ON public.activities FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'GM' AND 
    sales_id IN (SELECT id FROM public.users WHERE gm_id = auth.uid()))
);
CREATE POLICY "Admins see all activities" ON public.activities FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Sales can insert own activities" ON public.activities FOR INSERT WITH CHECK (sales_id = auth.uid());
CREATE POLICY "Admins can insert activities" ON public.activities FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- RLS Policies for targets table
CREATE POLICY "GMs see their team targets" ON public.targets FOR SELECT USING (
  gm_id = auth.uid() OR 
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admins see all targets" ON public.targets FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "GMs can create targets for their team" ON public.targets FOR INSERT WITH CHECK (
  gm_id = auth.uid() OR
  EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
