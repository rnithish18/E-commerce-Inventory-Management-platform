import { z } from 'zod';

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  brands: z.string().optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating_desc', 'newest', 'discount_desc']).default('newest'),
  in_stock: z.enum(['true', 'false']).optional(),
});

export const CreateProductSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  brand: z.string().max(100).optional(),
  price_paise: z.number().int().min(1, 'Price must be at least 1 paise'),
  mrp_paise: z.number().int().min(1, 'MRP must be at least 1 paise'),
  badge: z.enum(['Best Seller', 'Hot', 'Trending', 'Sale', 'New']).nullable().optional(),
  is_active: z.boolean().default(true),
  stock_qty: z.number().int().min(0).default(0),
  reorder_threshold: z.number().int().min(0).default(10),
  image_url: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
