const express = require('express');
const router = express.Router();
const SentimentAnalyzer = require('../utils/sentimentAnalyzer');
const TextProcessor = require('../utils/textProcessor');

const analyzer = new SentimentAnalyzer();

/**
 * POST /api/predict
 * Quick sentiment prediction for single text
 * 
 * Body:
 * {
 *   "text": "Review text here",
 *   "preprocess": true,  // Optional, default: true
 *   "lang": "id"         // Optional, default: "id"
 * }
 */
router.post('/', (req, res) => {
  try {
    const { 
      text, 
      preprocess = true,
      lang = 'id'
    } = req.body;

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: 'Text is required'
      });
    }

    // Preprocess if needed
    const processedText = preprocess 
      ? TextProcessor.preprocess(text, { lang })
      : text;

    // Analyze sentiment
    const result = analyzer.analyze(processedText);

    // Get text stats
    const stats = TextProcessor.getStats(text);

    res.json({
      ok: true,
      input: {
        original: text,
        processed: processedText,
        stats
      },
      prediction: result
    });

  } catch (error) {
    console.error('❌ Error in prediction:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to predict sentiment',
      message: error.message
    });
  }
});

module.exports = router;
