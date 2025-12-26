# API Documentation - Sales Activity Monitoring

## Overview

Sales Activity Monitoring menggunakan Next.js API Routes dengan Supabase sebagai backend database. Semua API endpoints menggunakan authentication berbasis Supabase dan role-based access control.

## Authentication

Semua API requests memerlukan authentication melalui Supabase. User session divalidasi secara otomatis pada setiap request.

### Headers yang Diperlukan
```
Authorization: Bearer <supabase-jwt-token>
```

## API Endpoints

### Chatbot API

#### `POST /api/chat`

AI-powered chatbot untuk Q&A tentang data penjualan.

**Request Body:**
```json
{
  "message": "Berapa total revenue saya bulan ini?",
  "userId": "uuid-user-id",
  "userRole": "Sales"
}
```

**Response:**
```json
{
  "response": "Berdasarkan data yang tersedia, total achievement revenue Anda adalah Rp 150.000.000 dari 3 closing activities."
}
```

**Error Responses:**
```json
{
  "error": "Message is required"
}
```

**Features:**
- Role-based data access
- Context-aware responses
- Support Indonesian dan English
- Revenue analytics
- Campaign information
- Activity summaries

## Database Tables & Access Control

### Row Level Security (RLS) Policies

#### users
- **Admin**: Full access ke semua users
- **GM/GM Non Sales**: View users di team mereka
- **Sales**: Hanya view profile sendiri
- **Read-only roles**: View terbatas

#### master_customers
- **All authenticated users**: Read access
- **Admin only**: Create, Update, Delete

#### master_campaigns
- **All authenticated users**: Read access
- **Admin only**: Create, Update, Delete

#### campaigns
- **Sales**: CRUD campaigns mereka sendiri
- **GM/GM Non Sales**: CRUD campaigns team mereka
- **Admin**: Full access semua campaigns

#### campaign_activities
- **Sales**: CRUD activities di campaigns mereka
- **GM/GM Non Sales**: CRUD activities di campaigns team
- **Admin**: Full access semua activities

## Data Models

### User
```typescript
interface User {
  id: string;
  nama_lengkap: string;
  email: string;
  role: 'Admin' | 'GM' | 'GM Non Sales' | 'Sales' | 'Presales' | 'Engineer' | 'Editor';
  gm_id?: string;
  department?: string;
  status_aktif: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
```

### Campaign
```typescript
interface Campaign {
  id: string;
  customer_id: string;
  campaign_id: string; // references master_campaigns
  sales_id: string;
  target_revenue?: number;
  created_at: string;
  updated_at: string;
}
```

### Campaign Activity
```typescript
interface CampaignActivity {
  id: string;
  campaign_id: string;
  jenis_aktivitas: string;
  keterangan?: string;
  potential_value?: number;
  tanggal_aktivitas?: string;
  pic?: string;
  presales_id?: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Standard Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_API_ERROR`: External service error

## Rate Limiting

- **Chatbot API**: 10 requests per minute per user
- **Database queries**: Unlimited (controlled by Supabase)

## Security

### Authentication
- JWT tokens via Supabase Auth
- Automatic token refresh
- Session validation pada setiap request

### Authorization
- Role-based access control (RBAC)
- Database-level RLS policies
- API-level permission checks

### Data Protection
- No sensitive data exposure
- Encrypted connections (HTTPS)
- Secure API key storage

## Monitoring & Logging

### Application Logs
- API request/response logging
- Error tracking
- Performance monitoring

### Database Logs
- Query execution times
- Failed transactions
- RLS policy violations

## Development

### Local Development
```bash
# Start development server
npm run dev

# API available at http://localhost:3000/api/*
```

### Testing API Endpoints
```bash
# Using curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "message": "Hello",
    "userId": "user-uuid",
    "userRole": "Sales"
  }'
```

### Environment Variables
```env
# Required for API functionality
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Production Deployment
- Automatic deployment via Vercel
- Environment variables configured in Vercel dashboard
- Database migrations run manually

### Health Checks
- API endpoint health monitoring
- Database connectivity checks
- External service availability

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check JWT token validity
- Verify user authentication
- Confirm token hasn't expired

**403 Forbidden**
- Verify user role permissions
- Check RLS policies
- Confirm user has access to requested resource

**500 Internal Server Error**
- Check server logs
- Verify database connectivity
- Confirm environment variables

### Debug Mode
Enable debug logging:
```env
DEBUG=true
NODE_ENV=development
```

## Future Enhancements

### Planned API Features
- [ ] Bulk operations API
- [ ] Advanced filtering and search
- [ ] Data export endpoints
- [ ] Real-time notifications
- [ ] Advanced analytics API
- [ ] Integration APIs untuk external systems

### Performance Optimizations
- [ ] API response caching
- [ ] Database query optimization
- [ ] Pagination untuk large datasets
- [ ] Rate limiting per endpoint
- [ ] API versioning
