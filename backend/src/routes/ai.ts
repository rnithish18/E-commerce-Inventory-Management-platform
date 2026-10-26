import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AiVisionService } from '../services/aiVision';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/v1/ai/analyze-image
router.post(
  '/analyze-image',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const imageUrl = req.body.imageUrl || (file ? `/uploads/products/${file.originalname}` : null);

      if (!file && !imageUrl) {
        return next(new AppError(400, 'Image file or imageUrl is required', 'MISSING_IMAGE'));
      }

      const analysis = await AiVisionService.analyzeImage({
        buffer: file?.buffer,
        imageUrl: imageUrl || 'uploaded_image.webp',
        filenameHint: file?.originalname || req.body.filenameHint || '',
      });

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/ai/image-search
router.post(
  '/image-search',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const imageUrl = req.body.imageUrl || (file ? `/uploads/products/${file.originalname}` : null);

      if (!file && !imageUrl) {
        return next(new AppError(400, 'Image file or imageUrl is required for visual search', 'MISSING_IMAGE'));
      }

      const analysis = await AiVisionService.analyzeImage({
        buffer: file?.buffer,
        imageUrl: imageUrl || 'query_image.webp',
        filenameHint: file?.originalname || req.body.filenameHint || '',
      });

      const matchedProducts = await AiVisionService.searchCatalogByImage(analysis);

      res.status(200).json({
        success: true,
        queryAnalysis: {
          category: analysis.suggestedCategory,
          tags: analysis.detectedTags,
          title: analysis.suggestedTitle,
        },
        count: matchedProducts.length,
        results: matchedProducts,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
