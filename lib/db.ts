import { neon } from '@neondatabase/serverless';

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!url) {
  throw new Error(
    'No database URL found. Set DATABASE_URL or POSTGRES_URL env variable.'
  );
}

export const sql = neon(url);

export async function initSchema() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS access_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    )
  `;

  // Migration: rename contact -> email if old schema exists
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='contact'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='email'
      ) THEN
        ALTER TABLE users RENAME COLUMN contact TO email;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='access_requests' AND column_name='contact'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='access_requests' AND column_name='email'
      ) THEN
        ALTER TABLE access_requests RENAME COLUMN contact TO email;
      END IF;
    END$$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invite_codes (
      code TEXT PRIMARY KEY,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      used_by UUID REFERENCES users(id) ON DELETE SET NULL,
      used_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS masters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      phone TEXT,
      specialty TEXT NOT NULL,
      area TEXT,
      description TEXT,
      added_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_masters_specialty ON masters(specialty)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_masters_area ON masters(area)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reviews_master ON reviews(master_id)`;

  // v2: passwords for re-login
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  await sql`DROP INDEX IF EXISTS idx_users_contact`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email))`;

  // v3: pre-hashed password on access requests so admin approval = direct user creation
  await sql`ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS password_hash TEXT`;

  // v4: multi-use invite codes with usage limit
  await sql`ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS usage_limit INTEGER NOT NULL DEFAULT 100`;
  await sql`ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE invite_codes ALTER COLUMN usage_limit SET DEFAULT 100`;
  await sql`UPDATE invite_codes SET usage_count = 1 WHERE used_by IS NOT NULL AND usage_count = 0`;
  await sql`UPDATE invite_codes SET usage_limit = 100 WHERE usage_limit < 100 AND usage_count < usage_limit`;

  // v5: emirate + maps url on masters; shops + shop_reviews
  await sql`ALTER TABLE masters ADD COLUMN IF NOT EXISTS emirate TEXT`;
  await sql`ALTER TABLE masters ADD COLUMN IF NOT EXISTS maps_url TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS shops (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      emirate TEXT,
      area TEXT,
      address TEXT,
      phone TEXT,
      maps_url TEXT,
      description TEXT,
      added_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shop_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shops_emirate ON shops(emirate)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shop_reviews_shop ON shop_reviews(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_masters_emirate ON masters(emirate)`;
}
