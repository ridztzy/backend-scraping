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
      const fileBuffer = fs.readFileSync(filePath);
      
      const file = await this.storage.createFile(
        process.env.APPWRITE_BUCKET_ID,
        ID.unique(),
        fileBuffer,
        [fileName]
      );

      // Generate download URL
      const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`;

      console.log(`✅ File uploaded to Appwrite: ${file.name}`);

      return {
        fileId: file.$id,
        fileName: file.name,
        downloadUrl,
        size: file.sizeOriginal,
        createdAt: file.$createdAt
      };
    } catch (error) {
      console.error('❌ Error uploading to Appwrite:', error.message);
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
