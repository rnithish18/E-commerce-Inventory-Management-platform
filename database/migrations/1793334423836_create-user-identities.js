/* eslint-disable camelcase */
/* Migration 012: User Identities, Auth Providers, Phone OTP, Magic Links & Contact Messages */

exports.up = async (pgm) => {
  // 1. user_identities table for multi-provider auth
  pgm.createTable('user_identities', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    provider: { type: 'varchar(50)', notNull: true },
    provider_user_id: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)' },
    email_verified: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  }, {
    constraints: {
      unique: ['provider', 'provider_user_id'],
    },
  });

  pgm.createIndex('user_identities', 'user_id');
  pgm.createIndex('user_identities', ['provider', 'email']);

  // Add phone_verified to users
  pgm.addColumns('users', {
    phone_verified: { type: 'boolean', notNull: true, default: false },
  });

  // Unique partial index on phone only when phone_verified = true
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_verified_unique 
    ON users(phone) 
    WHERE phone IS NOT NULL AND phone != '' AND phone_verified = true;
  `);

  // Make password_hash nullable for social/OTP only users if not already
  pgm.alterColumn('users', 'password_hash', {
    notNull: false,
  });

  // Backfill existing google_sub into user_identities
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'google_sub'
      ) THEN
        INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
        SELECT id, 'google', google_sub, email, true
        FROM users
        WHERE google_sub IS NOT NULL AND google_sub != ''
        ON CONFLICT (provider, provider_user_id) DO NOTHING;
      END IF;
    END $$;
  `);

  // 2. phone_otps table
  pgm.createTable('phone_otps', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    phone: { type: 'varchar(20)', notNull: true },
    otp_hash: { type: 'varchar(255)', notNull: true },
    attempts: { type: 'integer', notNull: true, default: 0 },
    max_attempts: { type: 'integer', notNull: true, default: 5 },
    resend_available_at: { type: 'timestamptz', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    consumed_at: { type: 'timestamptz' },
    ip_address: { type: 'varchar(45)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('phone_otps', ['phone', 'created_at']);

  // 3. magic_links table
  pgm.createTable('magic_links', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true },
    token_hash: { type: 'varchar(255)', notNull: true },
    cookie_binding_hash: { type: 'varchar(255)', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    consumed_at: { type: 'timestamptz' },
    ip_address: { type: 'varchar(45)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('magic_links', ['token_hash']);
  pgm.createIndex('magic_links', ['email', 'created_at']);

  // 4. contact_messages table (for real store Contact page in Part B)
  pgm.createTable('contact_messages', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    subject: { type: 'varchar(200)', notNull: true },
    message: { type: 'text', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'unread' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('contact_messages', ['status', 'created_at']);
};

exports.down = async (pgm) => {
  pgm.dropTable('contact_messages');
  pgm.dropTable('magic_links');
  pgm.dropTable('phone_otps');
  pgm.sql('DROP INDEX IF EXISTS idx_users_phone_verified_unique;');
  pgm.dropColumns('users', ['phone_verified']);
  pgm.dropTable('user_identities');
};
