# Base Project - Login & User Management

Project minimal yang hanya menyisakan fitur Login dan User Management.

## Struktur Project

```
app/
├── auth/
│   └── login/
│       └── page.tsx          # Login page
├── dashboard/
│   ├── layout.tsx            # Dashboard layout dengan sidebar
│   ├── page.tsx              # Dashboard home (minimal)
│   └── users/
│       └── page.tsx          # User management page
├── layout.tsx                # Root layout
└── page.tsx                  # Home page (redirect ke login)

components/
├── sidebar.tsx                # Sidebar minimal
├── top-nav.tsx               # Top navigation
├── users/
│   ├── users-list.tsx        # User list component
│   └── user-dialog.tsx       # User create/edit dialog
├── ui/                       # UI components (button, card, dialog, dll)
└── theme-toggle.tsx         # Theme toggle

lib/
├── supabase/
│   ├── client.ts            # Supabase client
│   ├── server.ts            # Supabase server
│   └── middleware.ts        # Supabase middleware
└── utils.ts                 # Utility functions

middleware.ts                 # Auth middleware
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup Supabase:
   - Buat project di Supabase
   - Copy `.env.local.example` ke `.env.local`
   - Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Setup Database:
   - Jalankan script SQL untuk membuat tabel users:
   ```sql
   -- Buat tabel users
   CREATE TABLE IF NOT EXISTS public.users (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     nama_lengkap TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     role TEXT NOT NULL CHECK (role IN ('Admin', 'GM', 'Sales', 'Presales', 'Engineer')),
     gm_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
     department TEXT,
     status_aktif BOOLEAN DEFAULT true,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );

   -- Disable RLS untuk users (atau buat policy sesuai kebutuhan)
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ```

4. Run development server:
```bash
npm run dev
```

## Fitur

- ✅ Login/Authentication
- ✅ User Management (CRUD)
- ✅ Role-based access (Admin only untuk user management)
- ✅ Dark mode support
- ✅ Responsive design

## Catatan

Project ini adalah base project minimal. Untuk menambahkan fitur baru, silakan extend dari struktur ini.

