const express = require('express');
const router = express.Router();
const gplay = require('google-play-scraper').default || require('google-play-scraper');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const appwriteStorage = require('../lib/appwriteStorage');

/**
 * POST /api/scrape-playstore
 * Scrape reviews from Google Play Store
 * 
 * Request body (MATCH FRONTEND):
 * {
 *   "appId": "com.whatsapp",
 *   "limit": 100,
 *   "sort": "newest" | "rating" | "helpful",
 *   "rating": "all" | "1" | "2" | "3" | "4" | "5",
 *   "lang": "id"
 * }
 */
router.post('/scrape-playstore', async (req, res) => {
  try {
    const { 
      appId, 
      limit = 100, 
      sort = 'newest',
      rating = 'all',
      lang = 'id'
    } = req.body;

    // Validation
    if (!appId) {
      return res.status(400).json({ 
        ok: false,
        error: 'appId is required' 
      });
    }

    console.log(`📱 Scraping Play Store: ${appId}`);
    console.log(`📊 Limit: ${limit}, Sort: ${sort}, Rating: ${rating}, Lang: ${lang}`);

    // Convert sort string to number (for google-play-scraper)
    const sortMap = {
      'newest': 1,
      'rating': 2,
      'helpful': 3
    };
    const sortNumber = sortMap[sort] || 1;

    // Convert rating string to number
    const starsFilter = rating === 'all' ? 0 : parseInt(rating);

    // Get app details
    const appDetails = await gplay.app({ appId, lang });

    // Scrape reviews
    const reviewsData = await gplay.reviews({
      appId,
      sort: sortNumber,
      num: parseInt(limit),
      lang: lang,
      country: lang === 'id' ? 'id' : 'us'
    });

    // Transform reviews
    const reviews = reviewsData.data.map((review, index) => ({
      id: review.id || `review-${index}`,
      userName: review.userName,
      userImage: review.userImage,
      date: review.date,
      rating: review.score,
      reviewText: review.text,
      replyDate: review.replyDate || '',
      replyText: review.replyText || '',
      thumbsUp: review.thumbsUp || 0,
      version: review.version || ''
    }));

    // Filter by rating if not 'all'
    const filteredReviews = starsFilter === 0 
      ? reviews 
      : reviews.filter(r => r.rating === starsFilter);

    console.log(`✅ Scraped ${filteredReviews.length} reviews (filtered from ${reviews.length})`);

    // Calculate stats
    const stats = calculateStats(filteredReviews);

    // Generate jobId
    const jobId = uuidv4();

    // Generate CSV
    const csvPath = await generateCSV(filteredReviews, appDetails, jobId);
    console.log(`📄 CSV generated: ${csvPath}`);

    // Upload to Appwrite (if enabled)
    let appwriteFileId = null;
    let appwriteUrl = null;
    
    if (appwriteStorage.isEnabled()) {
      try {
        const uploadResult = await appwriteStorage.uploadCSV(
          csvPath,
          `playstore-${appId}-${jobId}.csv`
        );
        appwriteFileId = uploadResult.fileId;
        appwriteUrl = uploadResult.downloadUrl;
      } catch (uploadError) {
        console.error('⚠️ Appwrite upload failed:', uploadError.message);
        // Continue even if upload fails
      }
    }

    // Clean up temp file
    fs.unlinkSync(csvPath);

    // Response (MATCH FRONTEND EXPECTATIONS)
    res.json({
      ok: true,
      jobId: jobId,
      count: filteredReviews.length,
      appwriteFileId: appwriteFileId,
      appwriteUrl: appwriteUrl,
      preview: filteredReviews,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error scraping Play Store:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to scrape Play Store',
      message: error.message
    });
  }
});

/**
 * Calculate statistics from reviews
 */
function calculateStats(reviews) {
  if (reviews.length === 0) {
    return {
      avgRating: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = parseFloat((totalRating / reviews.length).toFixed(2));

  // Calculate rating distribution
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  reviews.forEach(review => {
    const rating = review.rating.toString();
    if (distribution.hasOwnProperty(rating)) {
      distribution[rating]++;
    }
  });

  return {
    avgRating,
    ratingDistribution: distribution
  };
}

/**
 * Generate CSV from reviews
 */
async function generateCSV(reviews, appInfo, jobId) {
  // Create tmp directory
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filename = `playstore-${appInfo.appId}-${jobId}.csv`;
  const filepath = path.join(tmpDir, filename);

  // CSV headers
  const headers = [
    'App Name',
    'App ID',
    'User Name',
    'Date',
    'Rating',
    'Review Text',
    'Thumbs Up',
    'Version',
    'Reply Date',
    'Reply Text'
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  reviews.forEach(review => {
    const row = [
      escapeCSV(appInfo.title),
      escapeCSV(appInfo.appId),
      escapeCSV(review.userName),
      escapeCSV(review.date),
      review.rating,
      escapeCSV(review.reviewText),
      review.thumbsUp || 0,
      escapeCSV(review.version || ''),
      escapeCSV(review.replyDate || ''),
      escapeCSV(review.replyText || '')
    ];
    csvContent += row.join(',') + '\n';
  });

  fs.writeFileSync(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Escape CSV special characters
 */
function escapeCSV(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = router;
