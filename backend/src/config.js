'use strict';

/**
 * config.js
 * Reads environment variables and exports typed config.
 * No env values are ever printed or logged here.
 */

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

module.exports = config;
