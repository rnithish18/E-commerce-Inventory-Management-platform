/* Migration 004: Carts */

exports.up = (pgm) => {
  pgm.createTable('carts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, unique: true, references: '"users"', onDelete: 'CASCADE' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createTable('cart_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    cart_id: { type: 'uuid', notNull: true, references: '"carts"', onDelete: 'CASCADE' },
    product_id: { type: 'uuid', notNull: true, references: '"products"', onDelete: 'CASCADE' },
    variant_id: { type: 'uuid', references: '"product_variants"', onDelete: 'SET NULL' },
    quantity: { type: 'integer', notNull: true, default: 1 },
    added_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.addConstraint('cart_items', 'quantity_positive', 'CHECK (quantity > 0)');
  pgm.addConstraint('cart_items', 'cart_product_variant_unique', 'UNIQUE (cart_id, product_id, variant_id)');
  pgm.createIndex('cart_items', 'cart_id');
  pgm.createIndex('cart_items', 'product_id');
};

exports.down = (pgm) => {
  pgm.dropTable('cart_items');
  pgm.dropTable('carts');
};
