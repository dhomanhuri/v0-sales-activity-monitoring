# Files to Copy from Main Project

Copy the following files from the main project to this base project:

## Required Files

### 1. Authentication
- `app/auth/login/page.tsx` - Login page (already exists, keep as is)

### 2. User Management
- `app/dashboard/users/page.tsx` - User management page
- `components/users/users-list.tsx` - User list component
- `components/users/user-dialog.tsx` - User create/edit dialog

### 3. Layout & Navigation
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page (redirects to login)
- `components/top-nav.tsx` - Top navigation
- `components/theme-toggle.tsx` - Theme toggle component
- `components/theme-provider.tsx` - Theme provider

### 4. Profile (Optional but recommended)
- `app/dashboard/profile/page.tsx` - Profile settings page
- `components/profile/profile-settings.tsx` - Profile settings component

### 5. Supabase Setup
- `lib/supabase/client.ts` - Supabase client
- `lib/supabase/server.ts` - Supabase server
- `lib/supabase/middleware.ts` - Supabase middleware
- `lib/utils.ts` - Utility functions

### 6. Middleware
- `middleware.ts` - Auth middleware

### 7. UI Components (from components/ui/)
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/dialog.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/badge.tsx`
- `components/ui/avatar.tsx`
- `components/ui/image-cropper.tsx` (if using avatar upload)

### 8. Config Files
- `package.json` - Dependencies (keep minimal dependencies)
- `tsconfig.json` - TypeScript config
- `next.config.mjs` - Next.js config
- `tailwind.config.ts` - Tailwind config (if exists)
- `postcss.config.mjs` - PostCSS config
- `components.json` - shadcn/ui config

### 9. Styles
- `app/globals.css` or `styles/globals.css` - Global styles

### 10. Public Assets
- `public/logo.png` - Logo (optional)
- Other public assets as needed

## Quick Copy Commands

```bash
# From project root, create base-project directory structure first
mkdir -p base-project/app/auth/login
mkdir -p base-project/app/dashboard/users
mkdir -p base-project/components/users
mkdir -p base-project/components/ui
mkdir -p base-project/lib/supabase
mkdir -p base-project/public

# Copy files
cp app/auth/login/page.tsx base-project/app/auth/login/
cp app/dashboard/users/page.tsx base-project/app/dashboard/users/
cp app/layout.tsx base-project/app/
cp app/page.tsx base-project/app/
cp components/users/* base-project/components/users/
cp components/top-nav.tsx base-project/components/
cp components/theme-toggle.tsx base-project/components/
cp components/theme-provider.tsx base-project/components/
cp lib/supabase/* base-project/lib/supabase/
cp lib/utils.ts base-project/lib/
cp middleware.ts base-project/
cp components/ui/* base-project/components/ui/
cp package.json base-project/
cp tsconfig.json base-project/
cp next.config.mjs base-project/
cp postcss.config.mjs base-project/
cp components.json base-project/
cp app/globals.css base-project/app/  # or styles/globals.css
```

## After Copying

1. Update `package.json` to remove unused dependencies (optional)
2. Update imports if file paths changed
3. Test login and user management functionality
4. Remove any references to features not in base project

