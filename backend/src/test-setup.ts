import 'dotenv/config';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only-minimum-64-chars-long';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db';
