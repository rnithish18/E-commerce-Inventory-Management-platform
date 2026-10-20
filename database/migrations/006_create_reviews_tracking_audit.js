/* Migration 006: Reviews, Wishlists, Shipment Tracking, Audit Log */

exports.up = (pgm) => {
  pgm.createType('review_status', ['pending', 'approved', 'hidden']);

  pgm.createTable('reviews', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    product_id: { type: 'uuid', notNull: true, references: '"products"', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    order_item_id: { type: 'uuid', unique: true, references: '"order_items"', onDelete: 'SET NULL' },
    rating: { type: 'smallint', notNull: true },
    title: { type: 'varchar(200)' },
    body: { type: 'text' },
    status: { type: 'review_status', notNull: true, default: 'pending' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('reviews', 'rating_range', 'CHECK (rating >= 1 AND rating <= 5)');
  pgm.addConstraint('reviews', 'one_review_per_user_product', 'UNIQUE (product_id, user_id)');
  pgm.createIndex('reviews', 'product_id');
  pgm.createIndex('reviews', 'user_id');
  pgm.createIndex('reviews', 'status');

  pgm.createTable('shipment_tracking_events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, references: '"orders"', onDelete: 'CASCADE' },
    status: { type: 'varchar(50)', notNull: true },
    location: { type: 'varchar(200)' },
    description: { type: 'text' },
    created_by: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('shipment_tracking_events', 'order_id');
  pgm.createIndex('shipment_tracking_events', 'created_at');

  pgm.createTable('audit_log', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    entity_type: { type: 'varchar(50)', notNull: true },
    entity_id: { type: 'uuid', notNull: true },
    action: { type: 'varchar(50)', notNull: true },
    old_values: { type: 'jsonb' },
    new_values: { type: 'jsonb' },
    actor_user_id: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    ip_address: { type: 'varchar(45)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('audit_log', 'entity_type');
  pgm.createIndex('audit_log', 'entity_id');
  pgm.createIndex('audit_log', 'actor_user_id');
  pgm.createIndex('audit_log', 'created_at');

  pgm.createTable('wishlists', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    product_id: { type: 'uuid', notNull: true, references: '"products"', onDelete: 'CASCADE' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('wishlists', 'wishlist_unique', 'UNIQUE (user_id, product_id)');
  pgm.createIndex('wishlists', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('wishlists');
  pgm.dropTable('audit_log');
  pgm.dropTable('shipment_tracking_events');
  pgm.dropTable('reviews');
  pgm.dropType('review_status');
};
