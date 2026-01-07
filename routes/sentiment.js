const express = require('express');
const router = express.Router();
const SentimentAnalyzer = require('../utils/sentimentAnalyzer');

const analyzer = new SentimentAnalyzer();

/**
 * POST /api/sentiment/analyze
 * Analyze sentiment of single text or batch of texts
 * 
 * Body (single):
 * {
 *   "text": "This app is amazing!"
 * }
 * 
 * Body (batch):
 * {
 *   "texts": ["Good app", "Bad app", "OK app"]
 * }
 */
router.post('/analyze', (req, res) => {
  try {
    const { text, texts } = req.body;

    if (text) {
      // Single text analysis
      const result = analyzer.analyze(text);
      
      res.json({ 
        ok: true, 
        result 
      });
      
    } else if (texts && Array.isArray(texts)) {
      // Batch analysis
      const results = analyzer.analyzeBatch(texts);
      const stats = analyzer.getStats(results);
      
      res.json({
        ok: true,
        results,
        stats,
        preview: results.slice(0, 10)  // First 10 results
      });
      
    } else {
      res.status(400).json({
        ok: false,
        error: 'Please provide "text" (string) or "texts" (array)'
      });
    }
    
  } catch (error) {
    console.error('❌ Error analyzing sentiment:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

/**
 * POST /api/sentiment/reviews
 * Analyze sentiment of reviews array
 * Expects array of review objects with text field
 * 
 * Body:
 * {
 *   "reviews": [
 *     { "id": 1, "reviewText": "Great app!" },
 *     { "id": 2, "reviewText": "Terrible experience" }
 *   ],
 *   "textField": "reviewText"  // Optional, default: "reviewText"
 * }
 */
router.post('/reviews', (req, res) => {
  try {
    const { reviews, textField = 'reviewText' } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({
        ok: false,
        error: 'Please provide "reviews" array'
      });
    }

    // Analyze reviews
    const analyzed = analyzer.analyzeReviews(reviews, textField);
    
    // Get texts for stats
    const texts = reviews.map(r => r[textField] || '');
    const sentimentResults = analyzer.analyzeBatch(texts);
    const stats = analyzer.getStats(sentimentResults);

    res.json({
      ok: true,
      count: analyzed.length,
      reviews: analyzed,
      preview: analyzed.slice(0, 10),
      stats
    });

  } catch (error) {
    console.error('❌ Error analyzing reviews:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze reviews',
      message: error.message
    });
  }
});

module.exports = router;
