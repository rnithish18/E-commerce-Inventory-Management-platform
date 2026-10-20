/* Migration 003: Inventory Movements */

exports.up = (pgm) => {
  pgm.createType('inventory_movement_type', [
    'PURCHASE_IN',
    'SALE_OUT',
    'RETURN_IN',
    'ADJUSTMENT',
    'RESERVATION',
    'RESERVATION_RELEASE',
  ]);

  pgm.createTable('inventory_movements', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    product_id: { type: 'uuid', notNull: true, references: '"products"', onDelete: 'CASCADE' },
    variant_id: { type: 'uuid', references: '"product_variants"', onDelete: 'SET NULL' },
    type: { type: 'inventory_movement_type', notNull: true },
    quantity_change: { type: 'integer', notNull: true },
    stock_before: { type: 'integer', notNull: true },
    stock_after: { type: 'integer', notNull: true },
    reference_id: { type: 'uuid' },
    reference_type: { type: 'varchar(50)' },
    reason: { type: 'text' },
    actor_user_id: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('inventory_movements', 'product_id');
  pgm.createIndex('inventory_movements', 'variant_id');
  pgm.createIndex('inventory_movements', 'type');
  pgm.createIndex('inventory_movements', 'created_at');
  pgm.createIndex('inventory_movements', 'reference_id');
};

exports.down = (pgm) => {
  pgm.dropTable('inventory_movements');
  pgm.dropType('inventory_movement_type');
};
