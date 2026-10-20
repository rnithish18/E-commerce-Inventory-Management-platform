/* Migration 005: Orders, Payments, Refunds, Coupons */

exports.up = (pgm) => {
  pgm.createType('order_status', [
    'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
    'REFUND_REQUESTED', 'REFUNDED',
  ]);

  pgm.createType('payment_status', ['INITIATED', 'SUCCESS', 'FAILED', 'EXPIRED']);
  pgm.createType('refund_status', ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED']);

  // Coupons (created before orders because orders reference coupons)
  pgm.createTable('coupons', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    code: { type: 'varchar(50)', notNull: true, unique: true },
    type: { type: 'varchar(10)', notNull: true },
    value_paise: { type: 'integer', notNull: true },
    min_order_paise: { type: 'integer', notNull: true, default: 0 },
    max_discount_paise: { type: 'integer' },
    usage_limit: { type: 'integer' },
    per_user_limit: { type: 'integer', notNull: true, default: 1 },
    valid_from: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    valid_until: { type: 'timestamptz' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('coupons', 'coupon_type_valid', "CHECK (type IN ('percent', 'flat'))");
  pgm.addConstraint('coupons', 'coupon_value_positive', 'CHECK (value_paise > 0)');
  pgm.createIndex('coupons', 'code');
  pgm.createIndex('coupons', 'is_active');

  pgm.createTable('orders', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'RESTRICT' },
    address_id: { type: 'uuid', references: '"addresses"', onDelete: 'SET NULL' },
    status: { type: 'order_status', notNull: true, default: 'PENDING_PAYMENT' },
    subtotal_paise: { type: 'integer', notNull: true },
    discount_paise: { type: 'integer', notNull: true, default: 0 },
    tax_paise: { type: 'integer', notNull: true, default: 0 },
    shipping_paise: { type: 'integer', notNull: true, default: 0 },
    total_paise: { type: 'integer', notNull: true },
    coupon_id: { type: 'uuid', references: '"coupons"', onDelete: 'SET NULL' },
    coupon_code: { type: 'varchar(50)' },
    notes: { type: 'text' },
    reservation_expires_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('orders', 'total_non_negative', 'CHECK (total_paise >= 0)');
  pgm.addConstraint('orders', 'subtotal_positive', 'CHECK (subtotal_paise > 0)');
  pgm.createIndex('orders', 'user_id');
  pgm.createIndex('orders', 'status');
  pgm.createIndex('orders', 'created_at');

  pgm.createTable('order_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, references: '"orders"', onDelete: 'CASCADE' },
    product_id: { type: 'uuid', references: '"products"', onDelete: 'SET NULL' },
    variant_id: { type: 'uuid', references: '"product_variants"', onDelete: 'SET NULL' },
    // Price snapshots — never reference live product prices for historical orders
    product_name: { type: 'varchar(200)', notNull: true },
    sku: { type: 'varchar(100)' },
    description: { type: 'text' },
    quantity: { type: 'integer', notNull: true },
    unit_price_paise: { type: 'integer', notNull: true },
    total_price_paise: { type: 'integer', notNull: true },
  });
  pgm.addConstraint('order_items', 'item_quantity_positive', 'CHECK (quantity > 0)');
  pgm.addConstraint('order_items', 'item_unit_price_positive', 'CHECK (unit_price_paise > 0)');
  pgm.createIndex('order_items', 'order_id');
  pgm.createIndex('order_items', 'product_id');

  pgm.createTable('payment_attempts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, references: '"orders"', onDelete: 'CASCADE' },
    provider: { type: 'varchar(50)', notNull: true, default: 'razorpay' },
    provider_order_id: { type: 'varchar(100)' },
    provider_payment_id: { type: 'varchar(100)', unique: true }, // UNIQUE for idempotency
    status: { type: 'payment_status', notNull: true, default: 'INITIATED' },
    amount_paise: { type: 'integer', notNull: true },
    currency: { type: 'varchar(10)', notNull: true, default: 'INR' },
    provider_response: { type: 'jsonb' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('payment_attempts', 'order_id');
  pgm.createIndex('payment_attempts', 'provider_payment_id');
  pgm.createIndex('payment_attempts', 'status');

  pgm.createTable('refunds', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, references: '"orders"', onDelete: 'CASCADE' },
    payment_attempt_id: { type: 'uuid', references: '"payment_attempts"', onDelete: 'SET NULL' },
    amount_paise: { type: 'integer', notNull: true },
    reason: { type: 'text' },
    status: { type: 'refund_status', notNull: true, default: 'PENDING' },
    provider_refund_id: { type: 'varchar(100)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('refunds', 'order_id');

  pgm.createTable('coupon_redemptions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    coupon_id: { type: 'uuid', notNull: true, references: '"coupons"', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    order_id: { type: 'uuid', notNull: true, unique: true, references: '"orders"', onDelete: 'CASCADE' },
    discount_applied_paise: { type: 'integer', notNull: true },
    redeemed_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('coupon_redemptions', 'coupon_id');
  pgm.createIndex('coupon_redemptions', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('coupon_redemptions');
  pgm.dropTable('refunds');
  pgm.dropTable('payment_attempts');
  pgm.dropTable('order_items');
  pgm.dropTable('orders');
  pgm.dropTable('coupons');
  pgm.dropType('refund_status');
  pgm.dropType('payment_status');
  pgm.dropType('order_status');
};
