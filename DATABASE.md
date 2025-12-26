# Database Documentation - Sales Activity Monitoring

## Overview

Sales Activity Monitoring menggunakan PostgreSQL melalui Supabase dengan Row Level Security (RLS) untuk access control berbasis peran. Database dirancang dengan struktur campaign-based untuk tracking aktivitas penjualan yang comprehensive.

## Architecture

### Database Design Principles
- **Normalized Schema**: Data terorganisir dalam tabel terpisah untuk menghindari redundancy
- **Campaign-Based**: Semua aktivitas terhubung dengan campaign tertentu
- **Role-Based Security**: RLS policies mengontrol akses berdasarkan user role
- **Audit Trail**: Created_at dan updated_at fields untuk tracking perubahan

### Key Relationships
```
users (1) ──── (M) campaigns (1) ──── (M) campaign_activities
   │                     │
   └──────── (1) ────────┘
        GM hierarchy

master_customers (1) ──── (M) campaigns
master_campaigns (1) ──── (M) campaigns
```

## Schema Details

### users
Tabel utama untuk manajemen user dan role-based access.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'GM', 'GM Non Sales', 'Sales', 'Presales', 'Engineer', 'Editor')),
  gm_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department TEXT,
  status_aktif BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Primary key, references Supabase auth.users
- `nama_lengkap`: Full name user
- `email`: Unique email address
- `role`: User role (enum dengan 7 pilihan)
- `gm_id`: Reference ke GM yang menaungi (untuk Sales)
- `department`: Department name
- `status_aktif`: Active status flag
- `avatar_url`: Profile picture URL
- `created_at/updated_at`: Audit timestamps

### master_customers
Master data customers yang bisa digunakan ulang di multiple campaigns.

```sql
CREATE TABLE public.master_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sales_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Auto-generated UUID
- `name`: Customer name
- `description`: Additional customer info
- `sales_id`: Associated sales person (optional)
- `created_at/updated_at`: Audit timestamps

### master_campaigns
Master data campaign types yang bisa digunakan ulang.

```sql
CREATE TABLE public.master_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Auto-generated UUID
- `name`: Campaign type name
- `description`: Campaign description
- `created_at/updated_at`: Audit timestamps

### campaigns
Tabel utama yang menghubungkan customer, campaign type, dan sales person dengan target revenue.

```sql
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.master_customers(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.master_campaigns(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES public.users(id),
  target_revenue NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Auto-generated UUID
- `customer_id`: Reference ke master_customers
- `campaign_id`: Reference ke master_campaigns
- `sales_id`: Reference ke users (sales person)
- `target_revenue`: Target revenue dalam Rupiah
- `created_at/updated_at`: Audit timestamps

### campaign_activities
Tabel untuk mencatat semua aktivitas penjualan dalam campaign.

```sql
CREATE TABLE public.campaign_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  jenis_aktivitas TEXT NOT NULL CHECK (jenis_aktivitas IN ('Pitch Product', 'Tender', 'Closing')),
  keterangan TEXT,
  potential_value NUMERIC(15, 2),
  tanggal_aktivitas DATE,
  pic TEXT,
  presales_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Auto-generated UUID
- `campaign_id`: Reference ke campaigns
- `jenis_aktivitas`: Activity type (enum)
- `keterangan`: Activity description/notes
- `potential_value`: Potential revenue value
- `tanggal_aktivitas`: Activity date
- `pic`: Person in charge
- `presales_id`: Associated presales person
- `created_at/updated_at`: Audit timestamps

### activity_types (Legacy)
Tabel legacy untuk backward compatibility.

```sql
CREATE TABLE public.activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Row Level Security (RLS) Policies

### Authentication Required
Semua tabel mengaktifkan RLS dan memerlukan authentication:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_activities ENABLE ROW LEVEL SECURITY;
```

### Users Table Policies
```sql
-- All authenticated users can read users
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Admin can manage all users
CREATE POLICY "users_admin" ON public.users FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
```

### Master Data Policies
```sql
-- All authenticated users can read master data
CREATE POLICY "master_customers_select" ON public.master_customers FOR SELECT USING (true);
CREATE POLICY "master_campaigns_select" ON public.master_campaigns FOR SELECT USING (true);

-- Only Admin can modify master data
CREATE POLICY "master_customers_admin" ON public.master_customers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "master_campaigns_admin" ON public.master_campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
```

### Campaign Policies
```sql
-- Sales can see their own campaigns
CREATE POLICY "campaigns_select_sales" ON public.campaigns FOR SELECT
  USING (sales_id = auth.uid());

-- GM can see team campaigns
CREATE POLICY "campaigns_select_gm" ON public.campaigns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('GM', 'GM Non Sales') AND id IN (
      SELECT gm_id FROM public.users WHERE id = campaigns.sales_id
    )
  ));

-- Admin can see all campaigns
CREATE POLICY "campaigns_select_admin" ON public.campaigns FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

-- Insert/Update permissions follow same pattern
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT
  WITH CHECK (sales_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM', 'GM Non Sales')
  ));
```

### Activity Policies
```sql
-- Activities follow campaign access patterns
CREATE POLICY "campaign_activities_select_sales" ON public.campaign_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_activities.campaign_id AND campaigns.sales_id = auth.uid()
  ));

CREATE POLICY "campaign_activities_select_gm" ON public.campaign_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    JOIN public.users ON users.id = campaigns.sales_id
    WHERE campaigns.id = campaign_activities.campaign_id
    AND users.gm_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('GM', 'GM Non Sales'))
  ));

CREATE POLICY "campaign_activities_select_admin" ON public.campaign_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
```

## Migration Scripts

### Execution Order
Migration scripts harus dijalankan secara berurutan untuk menjaga data integrity:

1. **001_create_tables.sql** - Setup users table dan basic RLS
2. **002_seed_activity_types.sql** - Insert master data activity types
3. **003_create_trigger.sql** - Auto-update triggers
4. **004_create_test_users.js** - Node.js script untuk test users
5. **011_new_schema.sql** - Campaign-based schema
6. **013_create_campaign_tables.sql** - Complete campaign tables
7. **014_update_activity_types.sql** - Update activity types
8. **015_add_tanggal_to_campaign_activities.sql** - Add date field
9. **016_migrate_customer_to_activities.sql** - Data migration
10. **017_update_activity_types_new.sql** - Update activity types
11. **018_add_pic_to_campaign_activities.sql** - Add PIC field
12. **019_add_presales_role.sql** - Add presales role
13. **020_add_presales_rls_policies.sql** - Presales RLS policies
14. **021_add_department_to_gm.sql** - Add department to GM
15. **022_add_avatar_url.sql** - Avatar support
16. **023_setup_avatar_storage.sql** - Storage configuration
17. **024_add_presales_to_campaign_activities.sql** - Presales field
18. **025_add_engineer_role.sql** - Engineer role
19. **026_add_engineer_rls_policies.sql** - Engineer policies
20. **027_add_gm_non_sales_role.sql** - GM Non Sales role
21. **028_add_sales_id_to_master_customers.sql** - Sales association
22. **029_add_editor_role.sql** - Editor role

### Running Migrations
```bash
# Using psql
psql -h your-db-host -U your-db-user -d your-db-name -f scripts/001_create_tables.sql

# Using Node.js script
node scripts/004_create_test_users.js
```

## Indexes & Performance

### Recommended Indexes
```sql
-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_gm_id ON public.users(gm_id);

-- Campaigns table indexes
CREATE INDEX idx_campaigns_sales_id ON public.campaigns(sales_id);
CREATE INDEX idx_campaigns_customer_id ON public.campaigns(customer_id);
CREATE INDEX idx_campaigns_campaign_id ON public.campaigns(campaign_id);

-- Activities table indexes
CREATE INDEX idx_campaign_activities_campaign_id ON public.campaign_activities(campaign_id);
CREATE INDEX idx_campaign_activities_tanggal ON public.campaign_activities(tanggal_aktivitas);
CREATE INDEX idx_campaign_activities_jenis ON public.campaign_activities(jenis_aktivitas);
```

### Performance Considerations
- **Query Optimization**: Gunakan indexes untuk frequently queried columns
- **Connection Pooling**: Supabase handles connection pooling automatically
- **Caching**: Implement application-level caching untuk frequent queries
- **Pagination**: Implement pagination untuk large result sets

## Backup & Recovery

### Automated Backups
Supabase provides automated daily backups dengan retention period 7 hari.

### Manual Backup
```sql
-- Full database backup
pg_dump -h your-db-host -U your-db-user -d your-db-name > backup.sql

-- Specific table backup
pg_dump -h your-db-host -U your-db-user -d your-db-name -t public.users > users_backup.sql
```

### Data Export
```sql
-- Export campaigns with activities
COPY (
  SELECT
    c.id as campaign_id,
    mc.name as customer_name,
    mcamp.name as campaign_type,
    u.nama_lengkap as sales_name,
    c.target_revenue,
    ca.jenis_aktivitas,
    ca.potential_value,
    ca.tanggal_aktivitas
  FROM campaigns c
  JOIN master_customers mc ON c.customer_id = mc.id
  JOIN master_campaigns mcamp ON c.campaign_id = mcamp.id
  JOIN users u ON c.sales_id = u.id
  LEFT JOIN campaign_activities ca ON c.id = ca.campaign_id
  ORDER BY c.created_at DESC
) TO '/tmp/campaigns_export.csv' WITH CSV HEADER;
```

## Monitoring & Maintenance

### Health Checks
```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Maintenance Tasks
```sql
-- Update statistics
ANALYZE public.users;
ANALYZE public.campaigns;
ANALYZE public.campaign_activities;

-- Vacuum tables
VACUUM public.users;
VACUUM public.campaigns;
VACUUM public.campaign_activities;
```

## Troubleshooting

### Common Issues

**RLS Blocking Queries**
```sql
-- Check current user context
SELECT auth.uid(), auth.role();

-- Temporarily disable RLS for debugging (not for production)
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
```

**Performance Issues**
```sql
-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Data Integrity Issues**
```sql
-- Check foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';
```

## Future Schema Changes

### Planned Enhancements
- [ ] Activity attachments storage
- [ ] Campaign milestones tracking
- [ ] Customer segmentation
- [ ] Advanced reporting tables
- [ ] Audit logging table
- [ ] Notification system tables

### Migration Strategy
1. Create new tables/columns without affecting existing data
2. Update application code to use new schema
3. Migrate existing data if necessary
4. Remove deprecated tables/columns
5. Update RLS policies as needed

### Version Control
- Keep migration scripts numbered sequentially
- Document breaking changes
- Test migrations on staging environment first
- Backup data before major schema changes
