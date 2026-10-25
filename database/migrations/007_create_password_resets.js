exports.up = (pgm) => {
  pgm.createTable('password_resets', {
    id: { type: 'uuid', primaryKey: true, notNull: true },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    token_hash: { type: 'varchar(64)', notNull: true, unique: true },
    expires_at: { type: 'timestamptz', notNull: true },
    used_at: { type: 'timestamptz', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('password_resets', 'token_hash');
  pgm.createIndex('password_resets', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('password_resets');
};
