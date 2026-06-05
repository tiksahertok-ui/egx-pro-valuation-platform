/**
 * Supabase Schema Setup Script
 *
 * This script creates all tables in Supabase using the REST API.
 * Since the publishable key can't create tables directly, this generates
 * the SQL that needs to be run in the Supabase SQL Editor.
 *
 * Usage:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Copy and paste the contents of prisma/migration.sql
 * 3. Click "Run" to create all tables
 * 4. Then run: bun prisma/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

async function main() {
  console.log('🔍 EGX Pro - Supabase Database Setup')
  console.log('=====================================\n')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  // Test connection
  try {
    const { data, error } = await supabase.from('Stock').select('ticker').limit(1)
    if (error && error.code === 'PGRST205') {
      console.log('❌ Tables do not exist yet in Supabase.')
      console.log('\n📋 Please follow these steps:')
      console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
      console.log('   2. Navigate to SQL Editor')
      console.log('   3. Copy and paste the contents of prisma/migration.sql')
      console.log('   4. Click "Run" to create all tables')
      console.log('   5. Then run: bun prisma/seed-supabase.ts')
      console.log('\n📄 Migration SQL file: prisma/migration.sql')
      console.log(`   Contains ${fs.readFileSync('prisma/migration.sql', 'utf-8').split('\n').length} lines of SQL`)
    } else if (error) {
      console.log('⚠️  Connection test error:', error.message)
    } else {
      console.log('✅ Tables exist! Database is ready.')
      if (data && data.length > 0) {
        console.log(`   Found ${data.length} stock(s) in database`)
      } else {
        console.log('   No data yet. Run: bun prisma/seed-supabase.ts')
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err)
  }
}

main()
