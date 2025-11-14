import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testUsers = [
  {
    email: 'admin@test.com',
    password: 'admin123456',
    role: 'admin',
    name: 'Administrator'
  },
  {
    email: 'gm@test.com',
    password: 'gm123456',
    role: 'gm',
    name: 'General Manager'
  },
  {
    email: 'sales@test.com',
    password: 'sales123456',
    role: 'sales',
    name: 'Sales Person'
  }
]

async function createTestUsers() {
  console.log('[v0] Starting to create test users...')

  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`[v0] Error creating auth user ${user.email}:`, authError.message)
        continue
      }

      console.log(`[v0] Auth user created: ${user.email}`)

      // Insert into users table
      const { error: dbError } = await supabase.from('users').insert({
        id: authUser.user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: 'active'
      })

      if (dbError) {
        console.error(`[v0] Error inserting user record ${user.email}:`, dbError.message)
      } else {
        console.log(`[v0] User record created: ${user.email} (${user.role})`)
      }
    } catch (error) {
      console.error(`[v0] Unexpected error for ${user.email}:`, error.message)
    }
  }

  console.log('[v0] Test user creation completed!')
  process.exit(0)
}

createTestUsers()
