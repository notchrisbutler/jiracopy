/**
 * Utility functions for the Jira Markdown to HTML Converter
 */

export class Utils {
  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {boolean} immediate - Execute immediately on first call
   * @returns {Function} Debounced function
   */
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Generate unique ID
   * @param {string} prefix - Optional prefix
   * @returns {string} Unique ID
   */
  static generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format processing time for display
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} Formatted time string
   */
  static formatProcessingTime(milliseconds) {
    if (milliseconds < 1) return '<1ms';
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }

  /**
   * Format byte size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Sanitize HTML string
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML
   */
  static sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Validate markdown input
   * @param {string} markdown - Markdown string to validate
   * @param {number} maxLength - Maximum allowed length
   * @returns {Object} Validation result
   */
  static validateMarkdown(markdown, maxLength = 10000) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      length: markdown.length
    };

    // Check length
    if (markdown.length > maxLength) {
      result.isValid = false;
      result.errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Check for potentially problematic content
    if (markdown.includes('<script')) {
      result.warnings.push('Script tags detected - these will be sanitized');
    }

    if (markdown.includes('javascript:')) {
      result.warnings.push('JavaScript URLs detected - these will be sanitized');
    }

    // Check for very long lines (might cause rendering issues)
    const lines = markdown.split('\n');
    const longLines = lines.filter(line => line.length > 1000);
    if (longLines.length > 0) {
      result.warnings.push(`${longLines.length} very long lines detected (>1000 chars)`);
    }

    return result;
  }

  /**
   * Count markdown elements
   * @param {string} markdown - Markdown string to analyze
   * @returns {Object} Element counts
   */
  static countMarkdownElements(markdown) {
    const counts = {
      headers: 0,
      links: 0,
      codeBlocks: 0,
      inlineCode: 0,
      lists: 0,
      blockquotes: 0,
      tables: 0,
      bold: 0,
      italic: 0,
      images: 0
    };

    // Headers
    counts.headers = (markdown.match(/^#{1,6}\s+/gm) || []).length;

    // Links
    counts.links = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;

    // Code blocks
    counts.codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
    counts.codeBlocks += (markdown.match(/^    .+$/gm) || []).length;

    // Inline code
    counts.inlineCode = (markdown.match(/`[^`]+`/g) || []).length;

    // Lists
    counts.lists = (markdown.match(/^[\s]*[-*+]\s+/gm) || []).length;
    counts.lists += (markdown.match(/^[\s]*\d+\.\s+/gm) || []).length;

    // Blockquotes
    counts.blockquotes = (markdown.match(/^>\s+/gm) || []).length;

    // Tables
    counts.tables = (markdown.match(/\|.*\|/g) || []).length;

    // Bold text
    counts.bold = (markdown.match(/\*\*[^*]+\*\*/g) || []).length;
    counts.bold += (markdown.match(/__[^_]+__/g) || []).length;

    // Italic text
    counts.italic = (markdown.match(/\*[^*]+\*/g) || []).length;
    counts.italic += (markdown.match(/_[^_]+_/g) || []).length;

    // Images
    counts.images = (markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;

    return counts;
  }

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = Utils.deepClone(obj[key]);
      });
      return cloned;
    }
  }

  /**
   * Escape HTML entities
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  static escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Unescape HTML entities
   * @param {string} str - String to unescape
   * @returns {string} Unescaped string
   */
  static unescapeHtml(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
  }

  /**
   * Check if string is valid URL
   * @param {string} string - String to check
   * @returns {boolean} True if valid URL
   */
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Get file extension from URL or filename
   * @param {string} filename - Filename or URL
   * @returns {string} File extension
   */
  static getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Convert markdown element type to HTML tag
   * @param {string} type - Markdown element type
   * @returns {string} HTML tag name
   */
  static markdownToHtmlTag(type) {
    const mapping = {
      h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
      p: 'p', strong: 'strong', em: 'em', code: 'code',
      ul: 'ul', ol: 'ol', li: 'li',
      blockquote: 'blockquote',
      pre: 'pre', table: 'table', tr: 'tr', td: 'td', th: 'th',
      a: 'a', img: 'img', br: 'br', hr: 'hr'
    };
    return mapping[type] || 'div';
  }

  /**
   * Performance measurement utility
   * @param {string} label - Label for the measurement
   * @returns {Function} Function to end measurement
   */
  static startPerformanceMeasurement(label) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      console.log(`⏱️ ${label}: ${Utils.formatProcessingTime(duration)}`);
      return duration;
    };
  }

  /**
   * Local storage helper with error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store (optional, for get operation)
   * @returns {*} Stored value or null
   */
  static localStorage(key, value = undefined) {
    try {
      if (value !== undefined) {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } else {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.warn('localStorage error:', error);
      return null;
    }
  }

  /**
   * Create a Promise that resolves after specified delay
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise} Promise that resolves with function result
   */
  static async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i === maxRetries) break;
        
        const backoffDelay = delay * Math.pow(2, i);
        console.warn(`Retry ${i + 1}/${maxRetries} failed, waiting ${backoffDelay}ms:`, error.message);
        await Utils.delay(backoffDelay);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile device
   */
  static isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  /**
   * Check if device supports touch
   * @returns {boolean} True if touch is supported
   */
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get browser information
   * @returns {Object} Browser information
   */
  static getBrowserInfo() {
    const ua = navigator.userAgent;
    const browsers = {
      chrome: /chrome/i.test(ua) && !/edge/i.test(ua),
      firefox: /firefox/i.test(ua),
      safari: /safari/i.test(ua) && !/chrome/i.test(ua),
      edge: /edge/i.test(ua),
      ie: /trident/i.test(ua)
    };
    
    const browser = Object.keys(browsers).find(key => browsers[key]) || 'unknown';
    
    return {
      name: browser,
      userAgent: ua,
      mobile: Utils.isMobile(),
      touch: Utils.isTouchDevice()
    };
  }
} 