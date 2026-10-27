exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Trigram extension for fuzzy typo-tolerant search
  pgm.sql('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  // Trigram GIN indexes for fast fuzzy text searching
  pgm.sql('CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);');
  pgm.sql('CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);');
  pgm.sql('CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON categories USING gin (name gin_trgm_ops);');

  // 2. Customer Review Photos & Helpful Votes
  pgm.addColumns('reviews', {
    helpful_count: { type: 'integer', notNull: true, default: 0 },
  });

  pgm.createTable('review_images', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    review_id: {
      type: 'uuid',
      notNull: true,
      references: 'reviews',
      onDelete: 'CASCADE',
    },
    url: { type: 'text', notNull: true },
    thumbnail_url: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('review_images', 'review_id');

  pgm.createTable('review_helpful_votes', {
    review_id: {
      type: 'uuid',
      notNull: true,
      references: 'reviews',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, {
    constraints: {
      primaryKey: ['review_id', 'user_id'],
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('review_helpful_votes');
  pgm.dropTable('review_images');
  pgm.dropColumns('reviews', ['helpful_count']);
  pgm.sql('DROP INDEX IF EXISTS idx_categories_name_trgm;');
  pgm.sql('DROP INDEX IF EXISTS idx_products_brand_trgm;');
  pgm.sql('DROP INDEX IF EXISTS idx_products_name_trgm;');
};
