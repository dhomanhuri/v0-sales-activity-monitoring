# Contributing to Sales Activity Monitoring

Terima kasih atas minat Anda untuk berkontribusi pada Sales Activity Monitoring! Panduan ini akan membantu Anda memahami cara berkontribusi secara efektif ke proyek ini.

## 📋 Daftar Isi

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Database Changes](#database-changes)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)

## 🚀 Development Setup

### Prerequisites
- **Node.js**: Version 18.0 atau lebih tinggi
- **npm** atau **pnpm**: Package manager
- **Git**: Version control system
- **Supabase Account**: Untuk database development
- **OpenAI API Key**: Untuk chatbot functionality (opsional)

### Local Development Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd v0-sales-activity-monitoring

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.local.example .env.local
# Edit .env.local dengan credentials Anda

# 4. Setup database
# Jalankan migration scripts dalam urutan di DATABASE.md

# 5. Start development server
npm run dev
```

### Environment Configuration
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## 🔄 Development Workflow

### Branch Strategy
Kami menggunakan Git Flow dengan branch berikut:

```
main (production)
├── develop (development)
│   ├── feature/feature-name
│   ├── bugfix/bug-description
│   ├── hotfix/critical-fix
│   └── refactor/refactor-description
```

### Creating a Feature Branch
```bash
# 1. Sync dengan develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/nama-fitur-baru

# 3. Push branch ke remote
git push -u origin feature/nama-fitur-baru
```

### Commit Messages
Format commit message menggunakan conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(dashboard): add revenue chart to sales dashboard
fix(auth): resolve login redirect issue
docs(api): update chatbot endpoint documentation
refactor(components): optimize campaign list rendering
```

## 💻 Coding Standards

### TypeScript Guidelines
- **Strict Mode**: Semua TypeScript strict checks enabled
- **Type Safety**: Hindari `any` type, gunakan proper typing
- **Interface vs Type**: Gunakan `interface` untuk object types, `type` untuk unions
- **Null Safety**: Handle null/undefined cases properly

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

type UserRole = 'Admin' | 'GM' | 'Sales' | 'Presales' | 'Engineer' | 'Editor';

// ❌ Avoid
interface User {
  id: any;
  name: string;
  email?: string;
  role: string;
}
```

### React Best Practices
- **Functional Components**: Gunakan functional components dengan hooks
- **Custom Hooks**: Extract reusable logic ke custom hooks
- **Component Naming**: PascalCase untuk component names
- **Props Interface**: Define props interface untuk setiap component

```typescript
// ✅ Good
interface SalesDashboardProps {
  userId: string;
}

export function SalesDashboard({ userId }: SalesDashboardProps) {
  // Component logic
}

// ❌ Avoid
export function SalesDashboard(props) {
  const { userId } = props;
  // Component logic
}
```

### File Structure
```
components/
├── ui/                    # Reusable UI components
├── dashboards/           # Dashboard components
├── campaigns/            # Campaign-related components
└── [feature]/            # Feature-specific components

lib/
├── supabase/            # Database utilities
├── utils.ts             # General utilities
└── validations/         # Validation schemas

app/
├── api/                 # API routes
├── dashboard/           # Dashboard pages
└── [feature]/           # Feature pages
```

### Naming Conventions
- **Files**: kebab-case (e.g., `sales-dashboard.tsx`)
- **Components**: PascalCase (e.g., `SalesDashboard`)
- **Functions**: camelCase (e.g., `calculateRevenue`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE`)
- **Types**: PascalCase (e.g., `UserProfile`)

### CSS & Styling
- **Tailwind CSS**: Primary styling framework
- **Component-scoped**: Keep styles scoped to components
- **Consistent Spacing**: Use Tailwind spacing scale
- **Dark Mode**: Support dark/light mode themes

```tsx
// ✅ Good
<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">

// ❌ Avoid
<div className="bg-white border-slate-200 rounded-lg" style={{ padding: '24px' }}>
```

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component dan utility function tests
- **Integration Tests**: API route dan database operation tests
- **E2E Tests**: Critical user flow tests

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test File Structure
```
__tests__/
├── unit/
│   ├── components/
│   └── utils/
├── integration/
│   └── api/
└── e2e/
    └── user-flows/
```

### Test Example
```typescript
// components/__tests__/SalesDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { SalesDashboard } from '../SalesDashboard';

describe('SalesDashboard', () => {
  it('renders dashboard with user stats', () => {
    render(<SalesDashboard userId="test-user-id" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Campaign')).toBeInTheDocument();
  });
});
```

## 🗄 Database Changes

### Migration Guidelines
- **Versioned Scripts**: Simpan migration scripts di `scripts/` dengan nomor urut
- **Transactional**: Wrap changes dalam transaction blocks
- **Backward Compatible**: Pastikan tidak break existing functionality
- **Document Changes**: Update `DATABASE.md` untuk schema changes

### Migration Script Template
```sql
-- scripts/030_add_new_feature.sql
BEGIN;

-- Add new column
ALTER TABLE public.campaigns ADD COLUMN new_feature TEXT;

-- Add RLS policy
CREATE POLICY "campaigns_new_feature" ON public.campaigns FOR SELECT
  USING (true);

-- Update indexes if needed
CREATE INDEX idx_campaigns_new_feature ON public.campaigns(new_feature);

COMMIT;
```

### Testing Database Changes
```bash
# 1. Backup current database
pg_dump -h localhost -U postgres sales_monitoring > backup.sql

# 2. Run migration on test database
psql -h localhost -U postgres sales_monitoring_test -f scripts/030_add_new_feature.sql

# 3. Test application functionality
npm run dev

# 4. Rollback if needed
psql -h localhost -U postgres sales_monitoring_test < backup.sql
```

## 🔄 Pull Request Process

### Before Creating PR
1. **Update develop branch**: Sync dengan latest develop
2. **Run tests**: Pastikan semua tests pass
3. **Code formatting**: Run linter dan formatter
4. **Update documentation**: Update README/API docs jika perlu
5. **Test locally**: Verify functionality works

### PR Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

### PR Size Guidelines
- **Small PRs**: < 200 lines changed, mudah review
- **Medium PRs**: 200-500 lines, butuh lebih teliti
- **Large PRs**: > 500 lines, consider splitting menjadi multiple PRs

## 👀 Code Review Guidelines

### Reviewer Responsibilities
- **Functionality**: Does the code work as expected?
- **Code Quality**: Follows coding standards?
- **Security**: No security vulnerabilities?
- **Performance**: Efficient implementation?
- **Testing**: Adequate test coverage?

### Review Checklist
```markdown
## Code Review Checklist
- [ ] Code follows TypeScript/React best practices
- [ ] Proper error handling implemented
- [ ] Security considerations addressed
- [ ] Database queries optimized
- [ ] UI responsive dan accessible
- [ ] Tests included dan comprehensive
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Environment variables properly handled
```

### Common Feedback Points
- **Type Safety**: Ensure proper TypeScript usage
- **Performance**: Check for unnecessary re-renders, N+1 queries
- **Security**: Validate input, check RLS policies
- **UX**: Consider user experience implications
- **Maintainability**: Code readability dan reusability

## 🐛 Issue Reporting

### Bug Reports
Gunakan template berikut untuk bug reports:

```markdown
## Bug Description
Clear and concise description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable, add screenshots

## Environment
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome 91, Firefox 89]
- User Role: [e.g., Sales, Admin]

## Additional Context
Any other context about the problem
```

### Feature Requests
```markdown
## Feature Summary
Brief description of the feature

## Problem Statement
What's the problem this feature solves?

## Proposed Solution
Describe your proposed solution

## Alternatives Considered
Any alternative solutions?

## Additional Context
Screenshots, mockups, or additional information
```

## 📚 Documentation

### Documentation Standards
- **README.md**: Project overview, setup, usage
- **API.md**: API endpoints documentation
- **DATABASE.md**: Database schema dan migrations
- **Inline Comments**: Complex logic explanations
- **TypeScript Types**: Self-documenting code

### Updating Documentation
1. **Code Changes**: Update relevant docs when code changes
2. **New Features**: Add documentation for new features
3. **API Changes**: Update API documentation
4. **Breaking Changes**: Clearly mark breaking changes

## 🎯 Performance Guidelines

### Frontend Performance
- **Bundle Size**: Monitor bundle size dengan `npm run build`
- **Code Splitting**: Use dynamic imports untuk large components
- **Image Optimization**: Optimize images dengan Next.js Image component
- **Caching**: Implement proper caching strategies

### Database Performance
- **Query Optimization**: Use EXPLAIN ANALYZE untuk slow queries
- **Indexing**: Add indexes untuk frequently queried columns
- **Connection Pooling**: Utilize Supabase connection pooling
- **Pagination**: Implement pagination untuk large datasets

### Monitoring
- **Core Web Vitals**: Monitor dengan Vercel Analytics
- **Error Tracking**: Implement error tracking
- **Performance Budgets**: Set performance budgets

## 🔒 Security Considerations

### Code Security
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Sanitize user-generated content
- **CSRF Protection**: Use proper CSRF protection
- **Dependency Updates**: Keep dependencies updated

### Data Security
- **RLS Policies**: Ensure proper RLS implementation
- **Data Encryption**: Encrypt sensitive data
- **Access Logging**: Log access untuk audit purposes
- **Backup Security**: Secure backup procedures

## 🤝 Community Guidelines

### Communication
- **Respectful**: Treat all contributors dengan respect
- **Constructive**: Provide constructive feedback
- **Inclusive**: Welcome contributors dari diverse backgrounds
- **Patient**: Be patient dengan new contributors

### Recognition
- **Credit Contributors**: Acknowledge contributions
- **Mentorship**: Help new contributors learn
- **Knowledge Sharing**: Share knowledge dan best practices

---

**Terima kasih atas kontribusi Anda! 🚀**

Untuk pertanyaan atau diskusi, silakan buat issue atau hubungi maintainer.
