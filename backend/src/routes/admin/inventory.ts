import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
// Admin inventory routes — implemented in Week 3
const router = Router();
router.use(requireAuth, requireAdmin);
export default router;
