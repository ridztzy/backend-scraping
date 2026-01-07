const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || '*',
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - Play Store & App Store scraping
app.use('/api', require('./routes/scrapePlaystore'));
app.use('/api', require('./routes/scrapeAppStore'));
// app.use('/api', require('./routes/scrapeTwitter')); // TODO: Uncomment when frontend ready

// Sentiment Analysis routes
app.use('/api/sentiment', require('./routes/sentiment'));
app.use('/api', require('./routes/predict'));


// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'scraping-backend',
    appwriteEnabled: process.env.ENABLE_APPWRITE === 'true'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Scraping Backend API',
    categories: {
      scraping: [
        'POST /api/scrape-playstore',
        'POST /api/scrape-appstore'
      ],
      sentiment: [
        'POST /api/sentiment/analyze',
        'POST /api/sentiment/reviews',
        'POST /api/predict'
      ],
      utility: [
        'GET /api/health'
      ]
    },
    note: 'Twitter endpoint coming soon',
    appwriteEnabled: process.env.ENABLE_APPWRITE === 'true'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Scraping Backend running on port ${PORT}`);
  console.log(`📍 Appwrite Upload: ${process.env.ENABLE_APPWRITE === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
});
