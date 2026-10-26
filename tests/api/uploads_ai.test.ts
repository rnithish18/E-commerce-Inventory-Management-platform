import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import app from '../../backend/src/app';
import { validateMagicBytes } from '../../backend/src/routes/uploads';
import { AiVisionService, AiAnalysisResultSchema } from '../../backend/src/services/aiVision';

describe('Image Uploads & AI Vision Service Tests', () => {
  let sampleJpegBuffer: Buffer;
  let samplePngBuffer: Buffer;
  let fakeExecutableBuffer: Buffer;

  beforeAll(async () => {
    // Generate valid 200x200 JPEG
    sampleJpegBuffer = await sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 30, g: 41, b: 59 } },
    })
      .jpeg()
      .toBuffer();

    // Generate valid 200x200 PNG
    samplePngBuffer = await sharp({
      create: { width: 200, height: 200, channels: 4, background: { r: 249, g: 115, b: 22, alpha: 1 } },
    })
      .png()
      .toBuffer();

    // Fake malicious file disguised as .jpg with ASCII shell script text
    fakeExecutableBuffer = Buffer.from('#!/bin/bash\necho "Malicious payload"\nrm -rf /');
  });

  describe('Magic Bytes Validation', () => {
    it('accepts authentic JPEG magic bytes', () => {
      const res = validateMagicBytes(sampleJpegBuffer);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('jpeg');
    });

    it('accepts authentic PNG magic bytes', () => {
      const res = validateMagicBytes(samplePngBuffer);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('png');
    });

    it('rejects disguised executable or text file pretending to be image', () => {
      const res = validateMagicBytes(fakeExecutableBuffer);
      expect(res.valid).toBe(false);
      expect(res.format).toBeNull();
    });
  });

  describe('POST /api/v1/uploads/image Endpoint', () => {
    it('rejects upload with disguised executable even if named product.jpg', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/image')
        .attach('image', fakeExecutableBuffer, 'trojan.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_FILE_TYPE');
      expect(res.body.message).toContain('Magic bytes signature mismatch');
    });

    it('accepts authentic JPEG, strips EXIF, generates thumbnail, and returns image metadata', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/image')
        .attach('image', sampleJpegBuffer, 'headphone_sample.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toMatch(/^\/uploads\/products\/[a-zA-Z0-9-]+\.webp$/);
      expect(res.body.thumbUrl).toMatch(/^\/uploads\/products\/[a-zA-Z0-9-]+_thumb\.webp$/);
      expect(res.body.hash).toBeTruthy();
      expect(res.body.format).toBe('webp');

      // Verify files actually exist on disk
      const mainPath = path.resolve(process.cwd(), '.' + res.body.url);
      const thumbPath = path.resolve(process.cwd(), '.' + res.body.thumbUrl);
      expect(fs.existsSync(mainPath)).toBe(true);
      expect(fs.existsSync(thumbPath)).toBe(true);
    });

    it('accepts multi-image upload up to 5 images via /images', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/images')
        .attach('images', sampleJpegBuffer, 'front.jpg')
        .attach('images', samplePngBuffer, 'side.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.images).toHaveLength(2);
      expect(res.body.images[0].url).toContain('/uploads/products/');
      expect(res.body.images[1].url).toContain('/uploads/products/');
    });
  });

  describe('AI Vision Service & Caching', () => {
    it('generates structured analysis conforming to strict Zod schema', async () => {
      const analysis = await AiVisionService.analyzeImage({
        buffer: sampleJpegBuffer,
        imageUrl: '/uploads/products/sample_headphone.webp',
        filenameHint: 'sony_headphone_wireless.jpg',
      });

      // Strict Zod schema validation
      const parsed = AiAnalysisResultSchema.safeParse(analysis);
      expect(parsed.success).toBe(true);

      expect(analysis.suggestedTitle).toBeTruthy();
      expect(analysis.suggestedCategory).toBe('Electronics');
      expect(analysis.detectedTags.length).toBeGreaterThanOrEqual(3);
      expect(analysis.dominantColors.length).toBeGreaterThanOrEqual(1);
      expect(analysis.estimatedPriceRange.minPaise).toBeGreaterThan(0);
      expect(analysis.estimatedPriceRange.maxPaise).toBeGreaterThan(analysis.estimatedPriceRange.minPaise);
      expect(analysis.imageQualityScore).toBeGreaterThanOrEqual(1);
      expect(analysis.imageQualityScore).toBeLessThanOrEqual(100);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('retrieves cached analysis on second identical image hash request without re-analyzing', async () => {
      // Create a unique buffer for this run to ensure fresh first-time analysis
      const uniquePngBuffer = await sharp({
        create: {
          width: 150,
          height: 150,
          channels: 4,
          background: {
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255),
            alpha: 1,
          },
        },
      })
        .png()
        .toBuffer();

      // First analysis
      const first = await AiVisionService.analyzeImage({
        buffer: uniquePngBuffer,
        imageUrl: `/uploads/products/sample_shoe_${Date.now()}.webp`,
        filenameHint: 'nike_air_shoe.png',
      });
      expect(first.cached).toBe(false);

      // Second analysis with identical buffer
      const second = await AiVisionService.analyzeImage({
        buffer: uniquePngBuffer,
        imageUrl: `/uploads/products/sample_shoe_${Date.now()}.webp`,
        filenameHint: 'nike_air_shoe.png',
      });
      expect(second.cached).toBe(true);
      expect(second.imageHash).toBe(first.imageHash);
      expect(second.suggestedTitle).toBe(first.suggestedTitle);
    });

    it('POST /api/v1/ai/analyze-image endpoint returns full analysis with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analyze-image')
        .attach('image', sampleJpegBuffer, 'canon_camera.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestedTitle).toBeTruthy();
      expect(res.body.data.imageQualityScore).toBeGreaterThan(0);
      expect(res.body.data.dominantColors).toBeInstanceOf(Array);
    });

    it('POST /api/v1/ai/image-search endpoint performs visual catalog search and returns ranked products', async () => {
      const res = await request(app)
        .post('/api/v1/ai/image-search')
        .attach('image', sampleJpegBuffer, 'headphone_query.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0]).toHaveProperty('matchScore');
      expect(res.body.results[0].matchScore).toBeGreaterThanOrEqual(60);
      expect(res.body.results[0]).toHaveProperty('name');
      expect(res.body.results[0]).toHaveProperty('price_paise');
    });
  });
});
