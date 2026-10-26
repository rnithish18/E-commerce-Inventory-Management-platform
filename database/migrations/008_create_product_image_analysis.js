exports.up = (pgm) => {
  pgm.createTable('product_image_analysis', {
    id: { type: 'uuid', primaryKey: true, notNull: true },
    image_hash: { type: 'varchar(64)', notNull: true, unique: true },
    image_url: { type: 'text', notNull: true },
    suggested_title: { type: 'text', notNull: false },
    suggested_category: { type: 'text', notNull: false },
    suggested_description: { type: 'text', notNull: false },
    detected_tags: { type: 'jsonb', notNull: false, default: '[]' },
    dominant_colors: { type: 'jsonb', notNull: false, default: '[]' },
    estimated_price_range: { type: 'jsonb', notNull: false },
    image_quality_score: { type: 'integer', notNull: false, default: 85 },
    recommendations: { type: 'jsonb', notNull: false, default: '[]' },
    raw_analysis: { type: 'jsonb', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('product_image_analysis', 'image_hash');
};

exports.down = (pgm) => {
  pgm.dropTable('product_image_analysis');
};
