const Sentiment = require('sentiment');

class SentimentAnalyzer {
  constructor() {
    this.analyzer = new Sentiment();
  }

  /**
   * Analyze single text
   * Returns sentiment label, score, and confidence
   */
  analyze(text) {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'Neutral',
        score: 0,
        confidence: 0,
        comparative: 0,
        positive: [],
        negative: []
      };
    }

    const result = this.analyzer.analyze(text);
    
    // Classify based on score
    let label;
    if (result.score > 0) label = 'Positive';
    else if (result.score < 0) label = 'Negative';
    else label = 'Neutral';

    // Calculate confidence (0-1 scale, normalized)
    const confidence = Math.min(Math.abs(result.score) / 10, 1);

    return {
      sentiment: label,
      score: result.score,
      confidence: parseFloat(confidence.toFixed(2)),
      comparative: parseFloat(result.comparative.toFixed(3)),
      positive: result.positive,
      negative: result.negative,
      tokens: result.tokens
    };
  }

  /**
   * Analyze batch (array of texts)
   */
  analyzeBatch(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('Input must be an array of texts');
    }

    return texts.map(text => this.analyze(text));
  }

  /**
   * Get statistics from batch results
   */
  getStats(results) {
    if (!Array.isArray(results) || results.length === 0) {
      return {
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        distribution: {
          positive: '0.00',
          negative: '0.00',
          neutral: '0.00'
        },
        avgScore: 0,
        avgConfidence: 0
      };
    }

   const total = results.length;
    const positive = results.filter(r => r.sentiment === 'Positive').length;
    const negative = results.filter(r => r.sentiment === 'Negative').length;
    const neutral = results.filter(r => r.sentiment === 'Neutral').length;

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);

    return {
      total,
      positive,
      negative,
      neutral,
      distribution: {
        positive: (positive / total * 100).toFixed(2),
        negative: (negative / total * 100).toFixed(2),
        neutral: (neutral / total * 100).toFixed(2)
      },
      avgScore: parseFloat((totalScore / total).toFixed(2)),
      avgConfidence: parseFloat((totalConfidence / total).toFixed(2))
    };
  }

  /**
   * Analyze reviews array (with specific structure)
   * Expects array of objects with a text field
   */
  analyzeReviews(reviews, textField = 'reviewText') {
    const texts = reviews.map(review => review[textField] || '');
    const results = this.analyzeBatch(texts);

    // Combine with original review data
    return reviews.map((review, index) => ({
      ...review,
      sentiment: results[index]
    }));
  }
}

module.exports = SentimentAnalyzer;
