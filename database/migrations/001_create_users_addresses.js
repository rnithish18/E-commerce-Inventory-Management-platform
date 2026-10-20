/* eslint-disable camelcase */
/* Migration 001: Users and Addresses */

exports.up = (pgm) => {
  pgm.createType('user_role', ['CUSTOMER', 'ADMIN']);

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    full_name: { type: 'varchar(100)', notNull: true },
    phone: { type: 'varchar(20)' },
    role: { type: 'user_role', notNull: true, default: 'CUSTOMER' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');

  pgm.createTable('addresses', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    full_name: { type: 'varchar(100)', notNull: true },
    line1: { type: 'varchar(255)', notNull: true },
    line2: { type: 'varchar(255)' },
    city: { type: 'varchar(100)', notNull: true },
    state: { type: 'varchar(100)', notNull: true },
    pincode: { type: 'varchar(10)', notNull: true },
    phone: { type: 'varchar(20)', notNull: true },
    is_default: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('addresses', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('addresses');
  pgm.dropTable('users');
  pgm.dropType('user_role');
};
