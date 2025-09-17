const appConfig = {
  jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
  dbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdfunding',
  port: process.env.PORT || 3000,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_CLIENT_SECRET',
  sendGridApiKey: process.env.SENDGRID_API_KEY || 'SG.YOUR_SENDGRID_API_KEY',
  geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'
};

module.exports = appConfig;
