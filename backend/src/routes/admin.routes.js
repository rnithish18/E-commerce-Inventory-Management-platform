'use strict';

/**
 * routes/admin.routes.js
 * GET /api/admin/ping  -> requireAuth + requireAdmin
 */

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

const router = Router();

router.get('/ping', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = router;
