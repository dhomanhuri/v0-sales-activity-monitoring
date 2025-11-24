# Base Project - Login & User Management

Minimal Next.js project dengan fitur Login dan User Management menggunakan Supabase.

## Fitur

- ✅ Authentication (Login/Logout)
- ✅ User Management (CRUD) - Hanya untuk Admin
- ✅ Role-based access control
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Avatar upload (optional)

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Database

Jalankan script SQL di Supabase SQL Editor:
- `scripts/001_create_users_table.sql`

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Project Structure

```
base-project/
├── app/
│   ├── auth/login/          # Login page
│   ├── dashboard/
│   │   ├── layout.tsx      # Dashboard layout
│   │   ├── page.tsx        # Dashboard home
│   │   └── users/          # User management
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home (redirect)
├── components/
│   ├── sidebar.tsx         # Sidebar navigation
│   ├── top-nav.tsx         # Top navigation
│   ├── users/              # User components
│   └── ui/                 # UI components
├── lib/
│   ├── supabase/          # Supabase setup
│   └── utils.ts            # Utilities
├── scripts/               # SQL scripts
└── public/                # Static assets
```

## User Roles

- **Admin**: Full access, dapat manage users
- **GM**: General Manager (read-only untuk user management)
- **Sales**: Sales user (read-only)
- **Presales**: Presales user (read-only)
- **Engineer**: Engineer user (read-only)

## Setup Instructions

Lihat `SETUP.md` untuk instruksi setup lengkap.

## Copy Files

Lihat `COPY_FILES.md` untuk daftar file yang perlu di-copy dari project utama.

## License

MIT

