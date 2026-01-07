const stopword = require('stopword');

class TextProcessor {
  /**
   * Clean text (lowercase, remove special chars, etc.)
   */
  static cleanText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '') // Remove special characters
      .replace(/\s+/g, ' ')          // Remove extra spaces
      .trim();
  }

  /**
   * Remove stopwords (Indonesian & English)
   */
  static removeStopwords(text, lang = 'id') {
    if (!text) return '';
    
    const words = text.split(' ');
    
    // Use stopword library (supports ID & EN)
    const cleaned = lang === 'id' 
      ? stopword.removeStopwords(words, stopword.id)
      : stopword.removeStopwords(words);
    
    return cleaned.join(' ');
  }

  /**
   * Full preprocessing pipeline
   */
  static preprocess(text, options = {}) {
    const {
      lowercase = true,
      removeSpecialChars = true,
      removeStopwords = true,
      lang = 'id'
    } = options;

    if (!text) return '';

    let processed = text;

    if (lowercase) {
      processed = processed.toLowerCase();
    }

    if (removeSpecialChars) {
      processed = processed.replace(/[^a-z0-9\s]/gi, '');
      processed = processed.replace(/\s+/g, ' ');
    }

    if (removeStopwords) {
      processed = this.removeStopwords(processed, lang);
    }

    return processed.trim();
  }

  /**
   * Tokenize text into words
   */
  static tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Calculate basic text statistics
   */
  static getStats(text) {
    if (!text) return { words: 0, chars: 0, sentences: 0 };

    const words = this.tokenize(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      words: words.length,
      chars: text.length,
      sentences: sentences.length,
      avgWordLength: words.length > 0 
        ? (words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(2)
        : 0
    };
  }
}

module.exports = TextProcessor;
