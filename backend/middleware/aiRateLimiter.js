const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.user?.id?.toString() || ipKeyGenerator(req.ip),
  message: { error: 'Too many AI requests. Please wait before making more.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = aiRateLimiter;
