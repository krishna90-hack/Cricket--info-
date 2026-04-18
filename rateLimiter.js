/**
 * Rate Limiting Middleware
 * Protects APIs from abuse and brute-force attacks
 */

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { success: false, message },
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });

// Strict limiter for auth endpoints (anti brute-force)
const authLimiter = createLimiter(
  15, // 15 minutes
  10, // 10 attempts
  'Too many login attempts. Please try again in 15 minutes.'
);

// Standard API limiter
const apiLimiter = createLimiter(
  15,   // 15 minutes
  200,  // 200 requests
  'Too many requests. Please slow down and try again shortly.'
);

// Admin API limiter (generous but tracked)
const adminLimiter = createLimiter(
  15,
  300,
  'Too many admin requests. Please try again shortly.'
);

// Score update limiter (real-time updates can be frequent)
const scoreLimiter = createLimiter(
  1,    // 1 minute
  60,   // 60 updates per minute max (1/second)
  'Score update rate limit exceeded. Maximum 60 updates per minute.'
);

module.exports = { authLimiter, apiLimiter, adminLimiter, scoreLimiter };
