import logger from './logger';

// URL Storage and Management System
class URLStorage {
  constructor() {
    this.urls = new Map();
    this.shortcodes = new Set();
    this.loadFromStorage();
    logger.info('URL Storage system initialized');
  }

  // Load existing URLs from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('urlShortener_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.urls = new Map(data.urls || []);
        this.shortcodes = new Set(data.shortcodes || []);
        logger.info('Loaded existing URL data from storage', { 
          urlCount: this.urls.size, 
          shortcodeCount: this.shortcodes.size 
        });
      }
    } catch (error) {
      logger.error('Failed to load data from storage', { error: error.message });
    }
  }

  // Save URLs to localStorage
  saveToStorage() {
    try {
      const data = {
        urls: Array.from(this.urls.entries()),
        shortcodes: Array.from(this.shortcodes)
      };
      localStorage.setItem('urlShortener_data', JSON.stringify(data));
      logger.debug('URL data saved to storage');
    } catch (error) {
      logger.error('Failed to save data to storage', { error: error.message });
    }
  }

  // Generate a random shortcode
  generateShortcode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    logger.debug('Generated shortcode', { shortcode: result });
    return result;
  }

  // Validate shortcode format
  isValidShortcode(shortcode) {
    const isValid = /^[a-zA-Z0-9]{3,10}$/.test(shortcode);
    logger.debug('Shortcode validation', { shortcode, isValid });
    return isValid;
  }

  // Check if shortcode is unique
  isShortcodeUnique(shortcode) {
    const isUnique = !this.shortcodes.has(shortcode);
    logger.debug('Shortcode uniqueness check', { shortcode, isUnique });
    return isUnique;
  }

  // Create a unique shortcode
  createUniqueShortcode(preferredShortcode = null) {
    logger.info('Creating unique shortcode', { preferredShortcode });
    
    if (preferredShortcode) {
      if (!this.isValidShortcode(preferredShortcode)) {
        logger.warn('Invalid preferred shortcode format', { preferredShortcode });
        throw new Error('Shortcode must be 3-10 characters long and contain only letters and numbers');
      }
      
      if (!this.isShortcodeUnique(preferredShortcode)) {
        logger.warn('Preferred shortcode already exists', { preferredShortcode });
        throw new Error('This shortcode is already taken. Please choose a different one.');
      }
      
      logger.info('Using preferred shortcode', { shortcode: preferredShortcode });
      return preferredShortcode;
    }

    // Generate unique random shortcode
    let shortcode;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      shortcode = this.generateShortcode();
      attempts++;
      
      if (attempts > maxAttempts) {
        logger.error('Failed to generate unique shortcode after max attempts', { attempts });
        throw new Error('Unable to generate unique shortcode. Please try again.');
      }
    } while (!this.isShortcodeUnique(shortcode));

    logger.info('Generated unique shortcode', { shortcode, attempts });
    return shortcode;
  }

  // Validate URL format
  isValidURL(url) {
    try {
      const urlObj = new URL(url);
      const isValid = ['http:', 'https:'].includes(urlObj.protocol);
      logger.debug('URL validation', { url, isValid });
      return isValid;
    } catch (error) {
      logger.debug('URL validation failed', { url, error: error.message });
      return false;
    }
  }

  // Create shortened URL
  createShortURL(originalURL, validityMinutes = 30, preferredShortcode = null) {
    logger.info('Creating short URL', { 
      originalURL, 
      validityMinutes, 
      preferredShortcode 
    });

    // Validate original URL
    if (!this.isValidURL(originalURL)) {
      logger.error('Invalid URL provided', { originalURL });
      throw new Error('Please enter a valid URL (must start with http:// or https://)');
    }

    // Validate validity period
    if (!Number.isInteger(validityMinutes) || validityMinutes <= 0) {
      logger.error('Invalid validity period', { validityMinutes });
      throw new Error('Validity period must be a positive integer (minutes)');
    }

    try {
      const shortcode = this.createUniqueShortcode(preferredShortcode);
      const expiryDate = new Date(Date.now() + validityMinutes * 60 * 1000);
      
      const urlData = {
        originalURL,
        shortcode,
        expiryDate: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
        validityMinutes,
        clicks: 0,
        clickHistory: []
      };

      this.urls.set(shortcode, urlData);
      this.shortcodes.add(shortcode);
      this.saveToStorage();

      logger.info('Short URL created successfully', { 
        shortcode, 
        originalURL, 
        expiryDate: urlData.expiryDate 
      });

      return {
        shortcode,
        shortURL: `http://localhost:3000/${shortcode}`,
        originalURL,
        expiryDate: urlData.expiryDate,
        validityMinutes
      };
    } catch (error) {
      logger.error('Failed to create short URL', { 
        error: error.message, 
        originalURL, 
        preferredShortcode 
      });
      throw error;
    }
  }

  // Get geographical location (mock implementation for demo)
  async getGeographicalLocation() {
    try {
      // In a real application, you would use a geolocation API
      // For demo purposes, we'll simulate location data
      const mockLocations = [
        { city: 'New York', country: 'USA', region: 'North America' },
        { city: 'London', country: 'UK', region: 'Europe' },
        { city: 'Tokyo', country: 'Japan', region: 'Asia' },
        { city: 'Sydney', country: 'Australia', region: 'Oceania' },
        { city: 'Mumbai', country: 'India', region: 'Asia' },
        { city: 'Berlin', country: 'Germany', region: 'Europe' },
        { city: 'Toronto', country: 'Canada', region: 'North America' }
      ];
      
      const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
      logger.debug('Generated mock geographical location', { location: randomLocation });
      return randomLocation;
    } catch (error) {
      logger.error('Failed to get geographical location', { error: error.message });
      return { city: 'Unknown', country: 'Unknown', region: 'Unknown' };
    }
  }

  // Get source information from referrer
  getSourceInfo() {
    const referrer = document.referrer;
    const userAgent = navigator.userAgent;
    
    let source = 'Direct';
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        source = referrerUrl.hostname;
      } catch (error) {
        source = 'Unknown Referrer';
      }
    }

    // Detect browser type
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    const sourceInfo = {
      referrer: referrer || 'Direct',
      source,
      browser,
      userAgent: userAgent.substring(0, 100) // Truncate for storage
    };

    logger.debug('Generated source information', { sourceInfo });
    return sourceInfo;
  }

  // Get original URL by shortcode with detailed tracking
  async getOriginalURL(shortcode) {
    logger.debug('Retrieving original URL', { shortcode });
    
    const urlData = this.urls.get(shortcode);
    
    if (!urlData) {
      logger.warn('Shortcode not found', { shortcode });
      return null;
    }

    // Check if URL has expired
    const now = new Date();
    const expiryDate = new Date(urlData.expiryDate);
    
    if (now > expiryDate) {
      logger.warn('URL has expired', { shortcode, expiryDate: urlData.expiryDate });
      this.deleteURL(shortcode);
      return null;
    }

    // Track detailed click information
    const clickData = {
      timestamp: new Date().toISOString(),
      source: this.getSourceInfo(),
      location: await this.getGeographicalLocation(),
      clickId: Math.random().toString(36).substr(2, 9)
    };

    // Initialize clicks array if it doesn't exist
    if (!urlData.clickHistory) {
      urlData.clickHistory = [];
    }

    // Add click data
    urlData.clickHistory.push(clickData);
    urlData.clicks = urlData.clickHistory.length;
    
    this.urls.set(shortcode, urlData);
    this.saveToStorage();

    logger.info('URL accessed successfully with detailed tracking', { 
      shortcode, 
      originalURL: urlData.originalURL, 
      totalClicks: urlData.clicks,
      clickData 
    });

    return urlData.originalURL;
  }

  // Delete expired or specific URL
  deleteURL(shortcode) {
    logger.info('Deleting URL', { shortcode });
    
    if (this.urls.has(shortcode)) {
      this.urls.delete(shortcode);
      this.shortcodes.delete(shortcode);
      this.saveToStorage();
      logger.info('URL deleted successfully', { shortcode });
      return true;
    }
    
    logger.warn('URL not found for deletion', { shortcode });
    return false;
  }

  // Clean up expired URLs
  cleanupExpiredURLs() {
    logger.info('Starting cleanup of expired URLs');
    
    const now = new Date();
    let cleanedCount = 0;

    for (const [shortcode, urlData] of this.urls.entries()) {
      const expiryDate = new Date(urlData.expiryDate);
      if (now > expiryDate) {
        this.deleteURL(shortcode);
        cleanedCount++;
      }
    }

    logger.info('Expired URLs cleanup completed', { cleanedCount });
    return cleanedCount;
  }

  // Get all URLs (for statistics/management)
  getAllURLs() {
    logger.debug('Retrieving all URLs');
    return Array.from(this.urls.values());
  }
}

// Create singleton instance
const urlStorage = new URLStorage();

// Cleanup expired URLs on startup
urlStorage.cleanupExpiredURLs();

// Setup periodic cleanup (every 5 minutes)
setInterval(() => {
  urlStorage.cleanupExpiredURLs();
}, 5 * 60 * 1000);

export default urlStorage;
