/**
 * Security Middleware Configuration
 * Provides rate limiting, security headers, and request sanitization
 */

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

/**
 * General API Rate Limiter
 * Limits each IP to 100 requests per 15-minute window
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
});

/**
 * Strict Auth Rate Limiter
 * Limits login/register attempts to prevent brute force attacks
 * Only 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        status: 429,
        message: "Too many login attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Helmet Security Headers Configuration
 * Adds various HTTP headers for security
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Required for some CDNs
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Sanitize MongoDB Query Operators
 * Prevents NoSQL injection by stripping $ operators from input
 */
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === "object") {
            for (const key in obj) {
                if (key.startsWith("$")) {
                    delete obj[key];
                } else if (typeof obj[key] === "object") {
                    sanitize(obj[key]);
                }
            }
        }
        return obj;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);

    next();
};

/**
 * Password Reset Rate Limiter
 * Stricter than authLimiter — only 3 attempts per 15 minutes per IP
 * WHY stricter? Reset emails can be used for spam/harassment if unrestricted
 */
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per window
    message: {
        status: 429,
        message: "Too many password reset requests. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    helmetConfig,
    sanitizeInput,
};
