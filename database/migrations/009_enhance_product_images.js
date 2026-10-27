exports.up = (pgm) => {
  // Additive columns on product_images
  pgm.addColumns('product_images', {
    is_primary: { type: 'boolean', notNull: true, default: false },
    source_url: { type: 'text', notNull: false },
    license: { type: 'text', notNull: false, default: 'Proprietary / Fair Use Reference' },
    verified: { type: 'boolean', notNull: true, default: false },
  });

  // Additive column on products for fallback tracking
  pgm.addColumns('products', {
    needs_image: { type: 'boolean', notNull: true, default: false },
  });

  // Index on product_images for primary image quick-lookup
  pgm.createIndex('product_images', ['product_id', 'is_primary']);
  pgm.createIndex('product_images', ['product_id', 'sort_order']);
};

exports.down = (pgm) => {
  pgm.dropIndex('product_images', ['product_id', 'sort_order']);
  pgm.dropIndex('product_images', ['product_id', 'is_primary']);
  pgm.dropColumns('products', ['needs_image']);
  pgm.dropColumns('product_images', ['is_primary', 'source_url', 'license', 'verified']);
};
