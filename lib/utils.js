/**
 * ============================================
 * Text Extractor Pro - Utility Functions
 * Common utilities used across the extension
 * ============================================
 */

/**
 * Sanitizes HTML to prevent XSS attacks
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
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
 * Safely parses JSON with error handling
 * @param {string} json - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function safeJSONParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Safely stringifies object to JSON
 * @param {*} obj - Object to stringify
 * @param {string} defaultValue - Default value if stringification fails
 * @returns {string} JSON string or default value
 */
export function safeJSONStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    console.error('JSON stringify error:', error);
    return defaultValue;
  }
}

/**
 * Truncates text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formats date to readable string
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copies text to clipboard with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

/**
 * Downloads content as a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download file failed:', error);
    throw error;
  }
}

/**
 * Validates URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cleans filename for safe file system usage
 * @param {string} filename - Original filename
 * @param {number} maxLength - Maximum length
 * @returns {string} Cleaned filename
 */
export function cleanFilename(filename, maxLength = 50) {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, maxLength)
    .toLowerCase();
}

/**
 * Calculates reading time
 * @param {string} text - Text to analyze
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} Reading time in minutes
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Counts text statistics
 * @param {string} text - Text to analyze
 * @returns {Object} Statistics object
 */
export function getTextStats(text) {
  const trimmed = text.trim();
  const chars = text.length;
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = trimmed.split(/\n\n+/).filter(p => p.trim()).length;
  const lines = trimmed.split(/\n/).length;
  const readingTime = calculateReadingTime(text);
  
  return {
    characters: chars,
    words,
    sentences,
    paragraphs,
    lines,
    readingTime
  };
}

/**
 * Retries an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Initial delay in ms
 * @returns {Promise<*>} Function result
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Creates a promise that resolves after specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if code is running in extension context
 * @returns {boolean} Is extension context
 */
export function isExtensionContext() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

/**
 * Logs error with context
 * @param {string} context - Error context
 * @param {Error} error - Error object
 * @param {Object} metadata - Additional metadata
 */
export function logError(context, error, metadata = {}) {
  console.error(`[${context}]`, error, metadata);
  
  // Could send to error tracking service here
  if (isExtensionContext()) {
    try {
      chrome.storage.local.get(['errorLog'], (result) => {
        const errorLog = result.errorLog || [];
        errorLog.push({
          context,
          message: error.message,
          stack: error.stack,
          metadata,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 errors
        if (errorLog.length > 50) {
          errorLog.shift();
        }
        
        chrome.storage.local.set({ errorLog });
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }
}
