const express = require('express');
const router = express.Router();
const { Scraper } = require('@the-convocation/twitter-scraper');
const fs = require('fs');
const path = require('path');
const appwriteStorage = require('../lib/appwriteStorage');

/**
 * POST /api/scrape-twitter
 * Scrape tweets from Twitter/X
 */
router.post('/scrape-twitter', async (req, res) => {
  try {
    const { 
      query,
      username,
      count = 50,
      type = 'search'  // 'search' or 'timeline'
    } = req.body;

    // Validation
    if (!query && !username) {
      return res.status(400).json({ 
        success: false,
        error: 'Either "query" or "username" is required' 
      });
    }

    console.log(`🐦 Scraping Twitter: ${query || username}`);
    console.log(`📊 Count: ${count}, Type: ${type}`);

    const scraper = new Scraper();
    let tweets = [];
    let searchQuery = '';

    // Scrape based on type
    if (type === 'timeline' && username) {
      console.log(`📱 Scraping user timeline: @${username}`);
      const userTweets = scraper.getTweets(username, parseInt(count));
      
      // Collect tweets from async generator
      for await (const tweet of userTweets) {
        tweets.push(tweet);
        if (tweets.length >= parseInt(count)) break;
      }
      searchQuery = `@${username}`;
    } else if (query) {
      console.log(`🔍 Searching tweets: "${query}"`);
      const searchResults = scraper.searchTweets(query, parseInt(count));
      
      // Collect tweets from async generator
      for await (const tweet of searchResults) {
        tweets.push(tweet);
        if (tweets.length >= parseInt(count)) break;
      }
      searchQuery = query;
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid scraping type or missing parameters' 
      });
    }

    // Transform tweets
    const transformedTweets = tweets.map((tweet, index) => ({
      id: tweet.id || `tweet-${index}`,
      text: tweet.text || '',
      author: tweet.username || 'Unknown',
      username: tweet.username || 'unknown',
      profileImage: tweet.photos?.[0] || '',
      verified: false,
      createdAt: tweet.timeParsed?.toISOString() || new Date().toISOString(),
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      replies: tweet.replies || 0,
      url: tweet.permanentUrl || ''
    }));

    console.log(`✅ Scraped ${transformedTweets.length} tweets`);

    // Generate CSV
    const csvPath = await generateCSV(transformedTweets, searchQuery);
    console.log(`📄 CSV generated: ${csvPath}`);

    // Upload to Appwrite (if enabled)
    let uploadResult = null;
    if (appwriteStorage.isEnabled()) {
      try {
        uploadResult = await appwriteStorage.uploadCSV(
          csvPath,
          `twitter-${Date.now()}.csv`
        );
      } catch (uploadError) {
        console.error('⚠️ Appwrite upload failed:', uploadError.message);
        // Continue even if upload fails
      }
    }

    // Read CSV content for response
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Clean up temp file
    fs.unlinkSync(csvPath);

    // Response
    res.json({
      success: true,
      query: searchQuery,
      totalTweets: transformedTweets.length,
      tweets: transformedTweets,
      csv: uploadResult ? {
        uploaded: true,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        downloadUrl: uploadResult.downloadUrl,
        size: uploadResult.size
      } : {
        uploaded: false,
        content: csvContent,
        message: 'Appwrite upload is disabled. CSV content returned in response.'
      }
    });

  } catch (error) {
    console.error('❌ Error scraping Twitter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Twitter',
      message: error.message
    });
  }
});

/**
 * Generate CSV from tweets
 */
async function generateCSV(tweets, query) {
  // Create tmp directory
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filename = `twitter-${Date.now()}.csv`;
  const filepath = path.join(tmpDir, filename);

  // CSV headers
  const headers = [
    'Query',
    'Tweet ID',
    'Author',
    'Username',
    'Verified',
    'Created At',
    'Text',
    'Likes',
    'Retweets',
    'Replies',
    'URL'
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  tweets.forEach(tweet => {
    const row = [
      escapeCSV(query),
      escapeCSV(tweet.id),
      escapeCSV(tweet.author),
      escapeCSV(tweet.username),
      tweet.verified ? 'Yes' : 'No',
      escapeCSV(tweet.createdAt),
      escapeCSV(tweet.text),
      tweet.likes,
      tweet.retweets,
      tweet.replies,
      escapeCSV(tweet.url)
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
