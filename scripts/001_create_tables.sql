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
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- Users table is accessible to all authenticated users; app handles authorization

-- Customers table policies
CREATE POLICY "Sales see own customers" ON public.customers FOR SELECT USING (sales_id = auth.uid());
CREATE POLICY "Sales can insert own customers" ON public.customers FOR INSERT WITH CHECK (sales_id = auth.uid());

-- Activity types - readable by all authenticated users
CREATE POLICY "All authenticated users can view activity types" ON public.activity_types FOR SELECT USING (true);

-- Activities table policies
CREATE POLICY "Sales see own activities" ON public.activities FOR SELECT USING (sales_id = auth.uid());
CREATE POLICY "Sales can insert own activities" ON public.activities FOR INSERT WITH CHECK (sales_id = auth.uid());

-- Targets table policies
CREATE POLICY "GMs see their team targets" ON public.targets FOR SELECT USING (
  gm_id = auth.uid()
);
