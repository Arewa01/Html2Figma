// Plugin Configuration
// This file contains configuration settings for the HTML to Figma plugin

const PLUGIN_CONFIG = {
    // Backend Service URLs
    BACKEND_URLS: {
        development: 'http://localhost:3000',
        production: 'https://html-to-figma-backend.vercel.app' // Update with your actual deployment URL
    },

    // Current environment - change this to switch between dev and prod
    ENVIRONMENT: 'production', // 'development' or 'production'

    // Request settings
    REQUEST_TIMEOUT: 60000, // 60 seconds
    MAX_RETRIES: 2,

    // Image processing settings
    IMAGE_PROCESSING: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB max image size
        SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        TIMEOUT: 10000, // 10 seconds for image downloads
        MAX_CONCURRENT_DOWNLOADS: 5,
        BATCH_SIZE: 3
    },

    // Performance settings
    PERFORMANCE: {
        NODE_BATCH_SIZE: 15,
        BATCH_DELAY: 20,
        PROGRESS_UPDATE_INTERVAL: 100,
        MAX_PROCESSING_TIME: 300000, // 5 minutes
        MEMORY_CLEANUP_INTERVAL: 50
    }
};

// Get current backend URL based on environment
PLUGIN_CONFIG.BACKEND_URL = PLUGIN_CONFIG.BACKEND_URLS[PLUGIN_CONFIG.ENVIRONMENT];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PLUGIN_CONFIG;
}
