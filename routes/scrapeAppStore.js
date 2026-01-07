const express = require('express');
const router = express.Router();
const store = require('app-store-scraper');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const appwriteStorage = require('../lib/appwriteStorage');

/**
 * POST /api/scrape-appstore
 * Scrape reviews from Apple App Store
 * 
 * Request body (MATCH FRONTEND):
 * {
 *   "appId": "310633997",  // Numeric ID for iOS
 *   "limit": 100,
 *   "sort": "mostRecent" | "mostHelpful",
 *   "country": "id",
 *   "lang": "id"
 * }
 */
router.post('/scrape-appstore', async (req, res) => {
  try {
    const { 
      appId, 
      limit = 100, 
      sort = 'mostRecent',
      country = 'id',
      lang = 'id'
    } = req.body;

    // Validation
    if (!appId) {
      return res.status(400).json({ 
        ok: false,
        error: 'appId is required' 
      });
    }

    console.log(`🍎 Scraping App Store: ${appId}`);
    console.log(`📊 Limit: ${limit}, Sort: ${sort}, Country: ${country}, Lang: ${lang}`);

    // Convert sort string to app-store-scraper format
    const sortMap = {
      'mostRecent': store.sort.RECENT,
      'mostHelpful': store.sort.HELPFUL
    };
    const sortValue = sortMap[sort] || store.sort.RECENT;

    // Get app details
    const appDetails = await store.app({ 
      id: appId, 
      country: country 
    });

    // Scrape reviews
    const reviews = await store.reviews({
      id: appId,
      sort: sortValue,
      page: 1,
      country: country
    });

    // Get up to limit reviews
    const limitedReviews = reviews.slice(0, parseInt(limit));

    // Transform reviews to match format
    const transformedReviews = limitedReviews.map((review, index) => ({
      id: review.id || `review-${index}`,
      userName: review.userName,
      date: review.date,
      rating: review.score,
      reviewText: review.text,
      title: review.title || '',
      version: review.version || '',
      thumbsUp: 0  // App Store doesn't have thumbsUp
    }));

    console.log(`✅ Scraped ${transformedReviews.length} reviews`);

    // Calculate stats
    const stats = calculateStats(transformedReviews);

    // Generate jobId
    const jobId = uuidv4();

    // Generate CSV
    const csvPath = await generateCSV(transformedReviews, appDetails, jobId);
    console.log(`📄 CSV generated: ${csvPath}`);

    // Upload to Appwrite (if enabled)
    let appwriteFileId = null;
    let appwriteUrl = null;
    
    if (appwriteStorage.isEnabled()) {
      try {
        const uploadResult = await appwriteStorage.uploadCSV(
          csvPath,
          `appstore-${appId}-${jobId}.csv`
        );
        appwriteFileId = uploadResult.fileId;
        appwriteUrl = uploadResult.downloadUrl;
      } catch (uploadError) {
        console.error('⚠️ Appwrite upload failed:', uploadError.message);
        // Continue even if upload fails
      }
    }
    
    // Note: File cleanup is handled inside uploadCSV after upload completes

    // Response (MATCH FRONTEND EXPECTATIONS)
    res.json({
      ok: true,
      jobId: jobId,
      count: transformedReviews.length,
      appwriteFileId: appwriteFileId,
      appwriteUrl: appwriteUrl,
      preview: transformedReviews.slice(0, 10), // First 10 rows for preview
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error scraping App Store:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to scrape App Store',
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

  const filename = `appstore-${appInfo.id}-${jobId}.csv`;
  const filepath = path.join(tmpDir, filename);

  // CSV headers
  const headers = [
    'App Name',
    'App ID',
    'User Name',
    'Date',
    'Rating',
    'Review Title',
    'Review Text',
    'Version'
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  reviews.forEach(review => {
    const row = [
      escapeCSV(appInfo.title),
      escapeCSV(appInfo.id),
      escapeCSV(review.userName),
      escapeCSV(review.date),
      review.rating,
      escapeCSV(review.title || ''),
      escapeCSV(review.reviewText),
      escapeCSV(review.version || '')
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
