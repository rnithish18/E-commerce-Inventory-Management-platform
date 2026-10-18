'use strict';

/**
 * routes/auth.routes.js
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */

const { Router } = require('express');
const { body } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = Router();

/** Validation chains */
const registerValidation = [
  // .isString() must come first so non-string values are caught before
  // sanitisers like .trim() are applied (which coerce the value).
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  // normalizeEmail() has been intentionally removed: it applies
  // provider-specific transforms (Gmail dot removal, sub-address stripping,
  // etc.) that differ from the controller's trim+toLowerCase, causing
  // registered users to be unable to log in.
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required'),

  body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters'),
];

const loginValidation = [
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required'),

  body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required'),
];

/** Routes */
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
