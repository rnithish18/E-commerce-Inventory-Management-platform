exports.up = (pgm) => {
  pgm.addColumns('users', {
    google_sub: { type: 'varchar(255)', notNull: false, unique: true },
    auth_provider: { type: 'varchar(50)', notNull: true, default: 'local' },
  });

  // Make password_hash nullable for OAuth-only users
  pgm.alterColumn('users', 'password_hash', { notNull: false });
};

exports.down = (pgm) => {
  pgm.alterColumn('users', 'password_hash', { notNull: true });
  pgm.dropColumns('users', ['google_sub', 'auth_provider']);
};
