import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Ensure upload directories exist
const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const PRODUCTS_DIR = path.join(UPLOAD_ROOT, 'products');
const TEMP_DIR = path.join(UPLOAD_ROOT, 'temp');

[UPLOAD_ROOT, PRODUCTS_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Memory storage so we inspect magic bytes before saving to disk
const storage = multer.memoryStorage();
const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10)) * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: maxSizeBytes },
});

/**
 * Validates authentic file magic bytes
 */
export function validateMagicBytes(buf: Buffer): { valid: boolean; format: 'jpeg' | 'png' | 'webp' | null } {
  if (!buf || buf.length < 12) {
    return { valid: false, format: null };
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { valid: true, format: 'jpeg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { valid: true, format: 'png' };
  }
  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, format: 'webp' };
  }
  return { valid: false, format: null };
}

/**
 * Strips EXIF metadata, resizes to standard dimensions, and generates a thumbnail
 */
async function processAndSaveImage(file: Express.Multer.File) {
  const check = validateMagicBytes(file.buffer);
  if (!check.valid) {
    throw new AppError(
      400,
      'Invalid file format. Magic bytes signature mismatch. Only authentic JPEG, PNG, and WebP images are allowed.',
      'INVALID_FILE_TYPE'
    );
  }

  const fileId = uuidv4();
  const mainFilename = `${fileId}.webp`;
  const thumbFilename = `${fileId}_thumb.webp`;

  const mainPath = path.join(PRODUCTS_DIR, mainFilename);
  const thumbPath = path.join(PRODUCTS_DIR, thumbFilename);

  // 1. Process main image: rotate upright, resize max 1200x1200, strip EXIF metadata
  const mainProcessed = await sharp(file.buffer)
    .rotate()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .toFormat('webp', { quality: 85 })
    .toBuffer();

  await fs.promises.writeFile(mainPath, mainProcessed);

  // 2. Process thumbnail: max 300x300, strip EXIF metadata
  const thumbProcessed = await sharp(file.buffer)
    .rotate()
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .toFormat('webp', { quality: 80 })
    .toBuffer();

  await fs.promises.writeFile(thumbPath, thumbProcessed);

  // 3. Compute SHA-256 hash of original buffer
  const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const metadata = await sharp(mainProcessed).metadata();

  return {
    url: `/uploads/products/${mainFilename}`,
    thumbUrl: `/uploads/products/${thumbFilename}`,
    filename: mainFilename,
    hash,
    originalName: file.originalname,
    size: mainProcessed.length,
    width: metadata.width || 800,
    height: metadata.height || 800,
    format: 'webp',
  };
}

// POST /api/v1/uploads/image - Single image upload
router.post(
  '/image',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new AppError(400, 'No image file uploaded', 'MISSING_FILE'));
      }

      const result = await processAndSaveImage(req.file);
      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/uploads/images - Multi-image upload (up to 5 files)
router.post(
  '/images',
  upload.array('images', 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return next(new AppError(400, 'No image files uploaded', 'MISSING_FILE'));
      }

      const processed = await Promise.all(files.map((file) => processAndSaveImage(file)));

      res.status(201).json({
        success: true,
        count: processed.length,
        images: processed,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
