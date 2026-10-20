/* Migration 002: Categories, Products, Images, Variants */

exports.up = (pgm) => {
  pgm.createTable('categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true },
    slug: { type: 'varchar(100)', notNull: true, unique: true },
    icon: { type: 'varchar(10)' },
    parent_id: { type: 'uuid', references: '"categories"' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createType('product_badge', ['Best Seller', 'Hot', 'Trending', 'Sale', 'New']);

  pgm.createTable('products', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    category_id: { type: 'uuid', notNull: true, references: '"categories"', onDelete: 'RESTRICT' },
    name: { type: 'varchar(200)', notNull: true },
    slug: { type: 'varchar(250)', notNull: true, unique: true },
    description: { type: 'text' },
    brand: { type: 'varchar(100)' },
    price_paise: { type: 'integer', notNull: true },
    mrp_paise: { type: 'integer', notNull: true },
    badge: { type: 'product_badge' },
    average_rating: { type: 'numeric(3,2)', default: null },
    rating_count: { type: 'integer', notNull: true, default: 0 },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.addConstraint('products', 'price_positive', 'CHECK (price_paise > 0)');
  pgm.addConstraint('products', 'mrp_positive', 'CHECK (mrp_paise > 0)');
  pgm.addConstraint('products', 'price_lte_mrp', 'CHECK (price_paise <= mrp_paise)');
  pgm.addConstraint('products', 'rating_count_non_negative', 'CHECK (rating_count >= 0)');

  pgm.createIndex('products', 'category_id');
  pgm.createIndex('products', 'slug');
  pgm.createIndex('products', 'is_active');
  pgm.createIndex('products', 'badge');

  pgm.createTable('product_images', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    product_id: { type: 'uuid', notNull: true, references: '"products"', onDelete: 'CASCADE' },
    url: { type: 'varchar(500)', notNull: true },
    alt_text: { type: 'varchar(255)' },
    sort_order: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('product_images', 'product_id');

  pgm.createTable('product_variants', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    product_id: { type: 'uuid', notNull: true, references: '"products"', onDelete: 'CASCADE' },
    name: { type: 'varchar(100)', notNull: true },
    sku: { type: 'varchar(100)', notNull: true, unique: true },
    stock_qty: { type: 'integer', notNull: true, default: 0 },
    reserved_qty: { type: 'integer', notNull: true, default: 0 },
    reorder_threshold: { type: 'integer', notNull: true, default: 10 },
    price_adjustment_paise: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.addConstraint('product_variants', 'stock_non_negative', 'CHECK (stock_qty >= 0)');
  pgm.addConstraint('product_variants', 'reserved_non_negative', 'CHECK (reserved_qty >= 0)');
  pgm.createIndex('product_variants', 'product_id');
  pgm.createIndex('product_variants', 'sku');
};

exports.down = (pgm) => {
  pgm.dropTable('product_variants');
  pgm.dropTable('product_images');
  pgm.dropTable('products');
  pgm.dropType('product_badge');
  pgm.dropTable('categories');
};
