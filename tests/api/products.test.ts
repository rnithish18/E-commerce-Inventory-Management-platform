import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';

/**
 * Products API Integration Tests
 * Requires running PostgreSQL with seeded data.
 */

describe('Products API', () => {
  describe('GET /api/v1/products', () => {
    it('returns product list with pagination metadata', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('products');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('paginates correctly with limit param', async () => {
      const res = await request(app).get('/api/v1/products?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.pagination.page).toBe(1);
    });

    it('filters by search keyword', async () => {
      const res = await request(app).get('/api/v1/products?search=sony');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      // If seeded, all results should match the search
      res.body.products.forEach((p: any) => {
        const matchesSearch =
          p.name?.toLowerCase().includes('sony') ||
          p.brand?.toLowerCase().includes('sony') ||
          p.description?.toLowerCase().includes('sony');
        expect(matchesSearch).toBe(true);
      });
    });

    it('filters by category slug', async () => {
      const res = await request(app).get('/api/v1/products?category=electronics');
      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(p.category_slug).toBe('electronics');
      });
    });

    it('returns 400 for invalid sort value', async () => {
      const res = await request(app).get('/api/v1/products?sort=invalid_sort');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for page < 1', async () => {
      const res = await request(app).get('/api/v1/products?page=0');
      expect(res.status).toBe(400);
    });

    it('returns 400 for limit > 100', async () => {
      const res = await request(app).get('/api/v1/products?limit=101');
      expect(res.status).toBe(400);
    });

    it('sorts by price_asc correctly', async () => {
      const res = await request(app).get('/api/v1/products?sort=price_asc&limit=10');
      expect(res.status).toBe(200);
      const prices = res.body.products.map((p: any) => p.price_paise);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('product prices are integers (paise), not floats', async () => {
      const res = await request(app).get('/api/v1/products?limit=20');
      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(Number.isInteger(p.price_paise)).toBe(true);
        expect(Number.isInteger(p.mrp_paise)).toBe(true);
      });
    });
  });

  describe('GET /api/v1/products/featured', () => {
    it('returns featured products array', async () => {
      const res = await request(app).get('/api/v1/products/featured');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('featured products all have badges', async () => {
      const res = await request(app).get('/api/v1/products/featured');
      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(p.badge).not.toBeNull();
        expect(['Best Seller', 'Hot', 'Trending', 'Sale', 'New']).toContain(p.badge);
      });
    });

    it('returns at most 8 featured products', async () => {
      const res = await request(app).get('/api/v1/products/featured');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeLessThanOrEqual(8);
    });
  });

  describe('GET /api/v1/products/:slug', () => {
    it('returns 404 for nonexistent slug', async () => {
      const res = await request(app).get('/api/v1/products/does-not-exist-slug-ever');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    it('returns product detail with images and variants when slug exists', async () => {
      // First get a valid slug from the list
      const listRes = await request(app).get('/api/v1/products?limit=1');
      if (listRes.body.products.length > 0) {
        const slug = listRes.body.products[0].slug;
        const res = await request(app).get(`/api/v1/products/${slug}`);
        expect(res.status).toBe(200);
        expect(res.body.product).toHaveProperty('id');
        expect(res.body.product).toHaveProperty('images');
        expect(res.body.product).toHaveProperty('variants');
        expect(res.body.product).toHaveProperty('reviews');
        expect(Array.isArray(res.body.product.images)).toBe(true);
        expect(Array.isArray(res.body.product.variants)).toBe(true);
        // Price must be integer paise
        expect(Number.isInteger(res.body.product.price_paise)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/categories', () => {
    it('returns categories array', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('categories have expected fields', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      res.body.categories.forEach((c: any) => {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('slug');
        expect(c).toHaveProperty('product_count');
      });
    });
  });
});
