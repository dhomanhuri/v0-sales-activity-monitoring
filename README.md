# Sales Activity Monitoring System

*Sales Activity Monitoring System adalah platform manajemen aktivitas penjualan yang komprehensif dengan fitur tracking kampanye, monitoring aktivitas, dan analisis performa berbasis peran.*

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39.3-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Peran Pengguna](#-peran-pengguna)
- [Teknologi](#-teknologi)
- [Instalasi & Setup](#-instalasi--setup)
- [Konfigurasi Database](#-konfigurasi-database)
- [Penggunaan](#-penggunaan)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Pengembangan](#-pengembangan)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)

## 🚀 Fitur Utama

### ✅ Manajemen Pengguna & Autentikasi
- Login berbasis Supabase Auth
- Role-based access control (RBAC)
- Multi-level user permissions
- Avatar upload dengan image cropping

### ✅ Campaign Management
- Master data customers dan campaigns
- Assignment campaign ke sales person
- Target revenue per campaign
- Real-time tracking progress

### ✅ Activity Tracking
- Logging aktivitas penjualan (Pitch Product, Tender)
- Potential value tracking
- Activity history dengan timeline
- Status monitoring

### ✅ Dashboard Analytics
- Dashboard khusus per role (Sales, GM, Admin, dll)
- Revenue analytics (Target, Potential, Achievement)
- Progress tracking dengan visual indicators
- Recent activities overview

### ✅ AI-Powered Chatbot
- Chatbot cerdas menggunakan GPT-4o-mini
- Q&A tentang data penjualan
- Role-based data access
- Context-aware responses

### ✅ Master Data Management
- Master customers database
- Master campaigns database
- Activity types configuration
- User management (CRUD)

## 👥 Peran Pengguna

| Role | Akses | Deskripsi |
|------|-------|-----------|
| **Admin** | Full System | Kelola semua data, users, master data, dan sistem |
| **GM** | Team Management | Lihat performa tim, kelola targets, approve campaigns |
| **GM Non Sales** | Team Management | Sama dengan GM tapi fokus non-sales activities |
| **Sales** | Individual | Kelola campaign sendiri, log activities, lihat target |
| **Presales** | Read-Only | Lihat data untuk support presales |
| **Engineer** | Read-Only | Lihat data untuk technical support |
| **Editor** | Read-Only | Akses terbatas untuk editing data |

## 🏗️ Arsitektur Sistem

### System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Auth Service  │    │ • Users         │
│ • TypeScript    │    │ • API Routes    │    │ • Campaigns     │
│ • Tailwind CSS  │    │ • RLS Policies  │    │ • Activities    │
│ • Radix UI      │    │ • File Storage  │    │ • Master Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   AI Service    │
                    │   (OpenAI)      │
                    │                 │
                    │ • GPT-4o-mini  │
                    │ • Custom API    │
                    │ • Context-aware │
                    └─────────────────┘
```

### Frontend Architecture

#### **Next.js App Router Structure**
```
app/
├── layout.tsx              # Root layout dengan theme provider
├── page.tsx                # Landing page
├── globals.css             # Global styles & Tailwind
├── auth/
│   └── login/
│       └── page.tsx        # Authentication pages
├── dashboard/
│   ├── layout.tsx          # Dashboard layout dengan sidebar
│   ├── page.tsx            # Dashboard home (role-based)
│   ├── users/              # User management pages
│   ├── campaigns/          # Campaign management pages
│   ├── activities/         # Activity tracking pages
│   └── [other-modules]/    # Feature-specific pages
└── api/
    └── chat/
        └── route.ts         # API endpoints
```

#### **Component Architecture**
```
components/
├── ui/                     # Reusable UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── dashboards/             # Role-based dashboard components
│   ├── sales-dashboard.tsx
│   ├── gm-dashboard.tsx
│   ├── admin-dashboard.tsx
│   └── ...
├── campaigns/              # Campaign management components
│   ├── campaigns-list.tsx
│   ├── campaign-dialog.tsx
│   ├── campaign-detail.tsx
│   └── ...
├── [feature]/              # Feature-specific components
│   ├── [component].tsx
│   └── [component]-dialog.tsx
├── theme-provider.tsx      # Theme management (dark/light mode)
├── sidebar.tsx             # Navigation sidebar
└── top-nav.tsx             # Top navigation bar
```

#### **State Management**
- **Local State**: React `useState` untuk component state
- **Server State**: Direct database queries via Supabase client
- **Global State**: next-themes untuk theme management
- **Form State**: React Hook Form dengan Zod validation

### Backend Architecture

#### **API Routes Structure**
```
app/api/
└── chat/
    └── route.ts            # POST /api/chat
                              - OpenAI integration
                              - Role-based context
                              - Response streaming
```

#### **Supabase Integration**
```
lib/supabase/
├── client.ts              # Browser client untuk client components
├── server.ts              # Server client untuk server components
├── middleware.ts          # Auth middleware untuk route protection
└── types.ts               # TypeScript types (generated)
```

#### **Authentication Flow**
```
1. User Request ──► Middleware ──► Supabase Auth
                      │
                      └─► No Auth ──► Redirect to /auth/login
                         │
                         └─► Has Auth ──► Continue to page
                                      │
                                      └─► Database Query with RLS
```

### Database Architecture

#### **Schema Design**
```
users (1) ──── (M) campaigns (1) ──── (M) campaign_activities
   │                     │                     │
   │                     │                     │
   └──────── (1) ────────┘                     │
        GM hierarchy                           │
                                              │
master_customers (1) ──── (M) campaigns        │
master_campaigns (1) ──── (M) campaigns        │
                                              │
users (presales) ────── (M) campaign_activities
```

#### **Row Level Security (RLS)**
```sql
-- Hierarchical Access Control
Sales: Own campaigns + activities
GM: Team campaigns + activities
Admin: All data access
Read-only roles: Limited view access
```

#### **Data Flow Patterns**
```
Client Request ──► API Route ──► Supabase Query ──► PostgreSQL
                       │                │                │
                       └─► Auth Check   └─► RLS Filter   └─► Secure Data
```

### Component Communication

#### **Data Fetching Strategy**
- **Server Components**: Direct database access untuk initial data
- **Client Components**: Supabase client untuk interactive updates
- **Real-time**: Supabase subscriptions untuk live updates (future)

#### **Component Props Flow**
```
Page (Server) ──► Layout ──► Dashboard Component ──► Child Components
     │                │                │
     └─► User Data    └─► Navigation   └─► Business Logic
```

### External Integrations

#### **OpenAI Integration**
```
Frontend ──► API Route ──► OpenAI API
     │           │              │
     │           └─► Context    └─► GPT-4o-mini
     │               Building       Response
     │
     └─► Response Display
```

#### **Supabase Ecosystem**
```
Application ──► Supabase ──► PostgreSQL Database
     │              │              │
     │              └─► Auth       └─► RLS Policies
     │              │
     │              └─► Storage (Avatars)
     │
     └─► Real-time subscriptions (planned)
```

### Deployment Architecture

#### **Vercel Deployment**
```
Git Push ──► Vercel ──► Build Process ──► Static Assets
     │           │           │                │
     │           └─► Env     └─► Next.js      └─► CDN
     │               Vars        Build
     │
     └─► Webhook ──► Supabase ──► Database Updates
```

#### **Environment Strategy**
```bash
# Development
NEXT_PUBLIC_SUPABASE_URL=dev-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key

# Production
NEXT_PUBLIC_SUPABASE_URL=prod-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key

# Shared
OPENAI_API_KEY=ai-key
```

### Security Architecture

#### **Authentication Layers**
```
1. Route Protection ──► Middleware checks auth status
2. API Security ──► Supabase JWT validation
3. Database Security ──► RLS policies enforcement
4. Data Encryption ──► TLS for data in transit
```

#### **Authorization Matrix**
| Role | Users | Campaigns | Activities | Master Data | Dashboard |
|------|-------|-----------|------------|-------------|-----------|
| Admin | CRUD | CRUD | CRUD | CRUD | Full |
| GM | R | R/U team | R/U team | R | Team |
| Sales | R self | CRUD own | CRUD own | R | Personal |
| Read-only | R | R | R | R | Limited |

### Performance Optimizations

#### **Frontend Optimizations**
- **Static Generation**: Dashboard layouts pre-rendered
- **Dynamic Imports**: Large components lazy loaded
- **Image Optimization**: Next.js Image component
- **Bundle Splitting**: Route-based code splitting

#### **Database Optimizations**
- **Indexes**: Strategic indexes pada frequently queried columns
- **Query Optimization**: Efficient joins dan aggregations
- **Connection Pooling**: Supabase handles connection management
- **Caching**: Application-level caching untuk static data

### Scalability Considerations

#### **Horizontal Scaling**
- **Stateless Design**: No server-side sessions
- **CDN Distribution**: Static assets via Vercel CDN
- **Database Scaling**: Supabase auto-scaling capabilities

#### **Monitoring & Observability**
- **Error Tracking**: Sentry integration (planned)
- **Performance Monitoring**: Vercel Analytics
- **Database Monitoring**: Supabase dashboard
- **API Monitoring**: Response times dan error rates

## 🛠 Teknologi

### Frontend
- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework

### UI Components
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **React Easy Crop** - Image cropping

### Backend & Database
- **Supabase** - Backend-as-a-Service (Auth + Database + Storage)
- **PostgreSQL** - Database via Supabase
- **Row Level Security (RLS)** - Database-level access control

### AI & Integrations
- **OpenAI GPT-4o-mini** - AI chatbot via custom endpoint
- **Vercel Analytics** - Web analytics
- **Sonner** - Toast notifications

## 📦 Instalasi & Setup

### Prasyarat
- Node.js 18+
- npm atau pnpm
- Akun Supabase
- OpenAI API key (untuk chatbot)

### 1. Clone Repository
```bash
git clone <repository-url>
cd v0-sales-activity-monitoring
```

### 2. Install Dependencies
```bash
npm install
# atau
pnpm install
```

### 3. Environment Variables
Buat file `.env.local` di root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (untuk chatbot)
OPENAI_API_KEY=your_openai_api_key
```

### 4. Setup Database
Jalankan migration scripts secara berurutan:

```bash
# 1. Buat tabel dasar dan RLS policies
psql -h your-db-host -U your-db-user -d your-db-name -f scripts/001_create_tables.sql

# 2. Insert master data activity types
psql -h your-db-host -U your-db-user -d your-db-name -f scripts/002_seed_activity_types.sql

# 3. Buat trigger untuk updated_at
psql -h your-db-host -U your-db-user -d your-db-name -f scripts/003_create_trigger.sql
```

### 5. Buat Test Users
```bash
node scripts/004_create_test_users.js
```

### 6. Jalankan Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🗄 Konfigurasi Database

### Migration Scripts
Proyek ini menggunakan sistem migrasi berbasis SQL. Jalankan scripts dalam urutan berikut:

1. **001_create_tables.sql** - Tabel users, RLS policies
2. **002_seed_activity_types.sql** - Master data jenis aktivitas
3. **003_create_trigger.sql** - Auto-update timestamp
4. **004_create_test_users.js** - Script Node.js untuk buat user test
5. **011_new_schema.sql** - Schema campaign-based system
6. **013_create_campaign_tables.sql** - Tabel campaign lengkap
7. **014_update_activity_types.sql** - Update jenis aktivitas
8. **015_add_tanggal_to_campaign_activities.sql** - Tambah field tanggal

### Test Users
Setelah menjalankan script 004, user test berikut akan tersedia:

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | admin123456 | Admin |
| gm@test.com | gm123456 | GM |
| sales@test.com | sales123456 | Sales |

## 🎯 Penggunaan

### Login
1. Kunjungi `http://localhost:3000/auth/login`
2. Masukkan email dan password test user
3. Klik "Masuk"

### Dashboard Overview
Setelah login, Anda akan diarahkan ke dashboard sesuai role:

- **Sales**: Melihat campaign pribadi, progress target, aktivitas terbaru
- **GM**: Melihat performa tim, campaign team members
- **Admin**: Overview sistem lengkap, manajemen users
- **Read-only roles**: Dashboard dengan akses terbatas

### Campaign Management
1. **Sales**: Buat campaign baru dari master data
2. **Log Activities**: Record setiap interaksi dengan customer
3. **Track Progress**: Monitor achievement vs target revenue

### Chatbot
1. Klik floating button dengan ikon bot di kanan bawah
2. Tanyakan tentang campaign, revenue, atau aktivitas
3. Contoh: "Berapa total revenue saya bulan ini?"

## 📡 API Reference

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user

### Dashboard Endpoints
- `GET /api/dashboard/sales` - Sales dashboard data
- `GET /api/dashboard/gm` - GM dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data

### Campaign Endpoints
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign

### Activity Endpoints
- `GET /api/activities` - List activities
- `POST /api/activities` - Create activity
- `PUT /api/activities/[id]` - Update activity

### Chatbot Endpoint
- `POST /api/chat` - AI chatbot query

## 🗃 Database Schema

### users
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'GM', 'Sales', 'Presales', 'Engineer', 'Editor')),
  gm_id UUID REFERENCES public.users(id),
  department TEXT,
  status_aktif BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### master_customers
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

### master_campaigns
```sql
CREATE TABLE public.master_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### campaigns
```sql
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.master_customers(id),
  campaign_id UUID NOT NULL REFERENCES public.master_campaigns(id),
  sales_id UUID NOT NULL REFERENCES public.users(id),
  target_revenue NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### campaign_activities
```sql
CREATE TABLE public.campaign_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  jenis_aktivitas TEXT NOT NULL,
  keterangan TEXT,
  potential_value NUMERIC(15, 2),
  tanggal_aktivitas DATE,
  pic TEXT,
  presales_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 💻 Pengembangan

### Project Structure
```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages & layouts
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboards/       # Dashboard components
│   └── chatbot/          # Chatbot component
├── lib/                  # Utilities & configurations
│   └── supabase/         # Supabase client setup
├── scripts/              # Database migration scripts
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

### Development Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting dengan Next.js rules
- **Prettier**: Code formatting (via VS Code)
- **Tailwind**: Utility-first CSS approach

### Adding New Features
1. Buat component di `components/`
2. Tambah API route jika diperlukan di `app/api/`
3. Update database schema jika perlu
4. Test dengan berbagai user roles

## 🚀 Deployment

### Vercel Deployment
1. Connect repository ke Vercel
2. Set environment variables di Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
3. Deploy otomatis saat push ke main branch

### Environment Variables
```env
# Production Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
```

## 🔧 Troubleshooting

### Common Issues

**Login Error**
- Pastikan environment variables Supabase sudah benar
- Check apakah user sudah ada di database
- Verify RLS policies

**Database Connection Error**
- Jalankan migration scripts secara berurutan
- Check Supabase connection string
- Verify database credentials

**Chatbot Not Working**
- Pastikan `OPENAI_API_KEY` sudah diset
- Check API key valid dan punya credits
- Verify endpoint `https://ai.sumopod.com/v1` accessible

**Permission Denied**
- Check user role di database
- Verify RLS policies untuk tabel terkait
- Pastikan user login dengan role yang benar

### Debug Mode
Enable debug logging dengan menambah environment variable:
```env
DEBUG=true
NODE_ENV=development
```

## 🤝 Kontribusi

### Development Workflow
1. Fork repository
2. Buat feature branch: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m 'Add nama fitur'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

### Coding Standards
- Gunakan TypeScript untuk type safety
- Follow existing code patterns
- Test dengan multiple user roles
- Update documentation jika diperlukan

### Commit Messages
Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

## 📄 Lisensi

This project is proprietary software.

## 📞 Support

Untuk support atau pertanyaan:
1. Check [Troubleshooting](#troubleshooting) section
2. Review existing issues di repository
3. Buat issue baru jika diperlukan

---

**Dibuat dengan ❤️ menggunakan Next.js, Supabase, dan Tailwind CSS**
