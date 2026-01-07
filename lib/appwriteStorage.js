const { Client, Storage, ID } = require('node-appwrite');
const fs = require('fs');

class AppwriteStorage {
  constructor() {
    // Check if Appwrite is enabled
    this.enabled = process.env.ENABLE_APPWRITE === 'true';
    
    if (!this.enabled) {
      console.log('ℹ️ Appwrite upload is disabled');
      return;
    }

    // Validate required environment variables
    const requiredVars = [
      'APPWRITE_ENDPOINT',
      'APPWRITE_PROJECT_ID',
      'APPWRITE_API_KEY',
      'APPWRITE_BUCKET_ID'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Missing Appwrite config: ${missing.join(', ')}`);
      console.warn('⚠️ Appwrite upload will be disabled');
      this.enabled = false;
      return;
    }

    // Initialize Appwrite client
    try {
      this.client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
      
      this.storage = new Storage(this.client);
      console.log('✅ Appwrite Storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Appwrite:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Upload CSV file to Appwrite Storage
   * @param {string} filePath - Path to the CSV file
   * @param {string} fileName - Name for the file in storage
   * @returns {Promise<Object|null>} Upload result or null if disabled
   */
  async uploadCSV(filePath, fileName) {
    if (!this.enabled) {
      console.log('ℹ️ Appwrite upload skipped (disabled)');
      return null;
    }

    try {
      // Read file buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Convert buffer to Blob then to File (Web API - available in Node 18+)
      const blob = new Blob([fileBuffer], { type: 'text/csv' });
      const file = new File([blob], fileName, { type: 'text/csv' });
      
      // Upload to Appwrite
      const result = await this.storage.createFile(
        process.env.APPWRITE_BUCKET_ID,
        ID.unique(),
        file
      );

      // Generate download URL
      const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${result.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`;

      console.log(`✅ File uploaded to Appwrite: ${result.name}`);
      
      // Clean up temp file AFTER successful upload
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to cleanup temp file: ${cleanupError.message}`);
      }

      return {
        fileId: result.$id,
        fileName: result.name,
        downloadUrl,
        size: result.sizeOriginal,
        createdAt: result.$createdAt
      };
    } catch (error) {
      console.error('❌ Error uploading to Appwrite:', error.message);
      console.error('Error details:', error);
      
      // Clean up temp file even on error
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Check if Appwrite is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}

module.exports = new AppwriteStorage();
