// Vercel serverless entry point - wraps the Express app from backend/server.js
// so every /api/* request (see the rewrite in vercel.json) is handled by it.
module.exports = require('../backend/server');
