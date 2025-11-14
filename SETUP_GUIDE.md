# Setup Guide untuk Sales Activity Monitoring

## Step 1: Setup Database
Jalankan SQL migration scripts dalam urutan ini:

1. **scripts/001_create_tables.sql** - Buat semua tabel dan RLS policies
2. **scripts/002_seed_activity_types.sql** - Insert master data activity types
3. **scripts/003_create_trigger.sql** - Buat trigger untuk updated_at

## Step 2: Buat Test Users
Jalankan script Node.js untuk membuat test users:

\`\`\`bash
node scripts/004_create_test_users.js
\`\`\`

**Test Users yang akan dibuat:**
- Email: `admin@test.com` | Password: `admin123456` | Role: Admin
- Email: `gm@test.com` | Password: `gm123456` | Role: General Manager
- Email: `sales@test.com` | Password: `sales123456` | Role: Sales

## Step 3: Login
1. Buka aplikasi: http://localhost:3000
2. Klik tombol "Masuk" atau kunjungi http://localhost:3000/auth/login
3. Masukkan email dan password test user
4. Klik "Masuk"

## Struktur Role dan Akses

### Admin
- Lihat dan kelola semua users
- Lihat dan kelola semua customers
- Lihat dan kelola semua activities
- Lihat dan kelola targets
- Kelola master data (activity types)
- Dashboard khusus admin

### General Manager (GM)
- Lihat customers tim mereka
- Lihat activities tim mereka
- Kelola targets untuk tim mereka
- Dashboard khusus GM

### Sales
- Kelola customer sendiri
- Log activities sendiri
- Lihat target pribadi mereka
- Dashboard khusus sales

## Database Schema

### users
- id, email, name, role (admin/gm/sales), gm_id (untuk sales), status, created_at, updated_at

### customers
- id, name, email, phone, company, pipeline_stage, potential_value, lead_source, assigned_to_sales_id, created_at, updated_at

### activities
- id, customer_id, assigned_to_sales_id, activity_type_id, status, notes, next_steps, attachments, created_at, updated_at

### activity_types
- id, name, description

### targets
- id, sales_id, month, target_leads, target_proposals, target_closings, target_revenue, created_at, updated_at

## Troubleshooting

**Import Error?**
- Pastikan environment variables sudah diset di Vercel
- Check SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

**Database connection error?**
- Jalankan migration scripts terlebih dahulu
- Pastikan Supabase integration sudah connected

**Login error?**
- Jalankan script 004_create_test_users.js untuk membuat test users
- Pastikan email dan password sesuai
