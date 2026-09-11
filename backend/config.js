// Vercel deploys don't read backend/.env (it's gitignored), so without a
// JWT_SECRET set in the Vercel project's environment variables, jwt.sign()/
// verify() throw and every auth request 500s. Fall back to a default so the
// deploy still works out of the box; set a real JWT_SECRET in the Vercel
// dashboard for anything beyond a demo.
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set - using an insecure default. Set it in your Vercel project env vars.');
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'polar-expedition-hackathon-secret-key-change-in-prod',
};
