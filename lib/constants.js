/**
 * ============================================
 * Text Extractor Pro - Constants
 * Centralized configuration and constants
 * ============================================
 */

// Extension metadata
export const EXTENSION_NAME = 'Text Extractor Pro';
export const EXTENSION_VERSION = '3.0.0';
export const EXTENSION_ID = 'text-extractor-pro';

// Storage keys
export const STORAGE_KEYS = {
  LAST_EXTRACTED: 'lastExtractedData',
  PREFERENCES: 'userPreferences',
  ERROR_LOG: 'errorLog',
  EXTRACTION_HISTORY: 'extractionHistory',
  CUSTOM_TEMPLATES: 'customTemplates',
  THEME: 'theme',
  TEXTAREA_HEIGHT: 'textareaHeight'
};

// Default options
export const DEFAULT_OPTIONS = {
  preserveStructure: true,
  includeTables: true,
  includeLinks: false,
  includeImages: false,
  cleanWhitespace: true,
  removeAds: true,
  format: 'structured'
};

// Output formats
export const OUTPUT_FORMATS = {
  STRUCTURED: 'structured',
  MARKDOWN: 'markdown',
  HTML: 'html',
  JSON: 'json',
  PLAIN: 'plain',
  PDF: 'pdf'
};

// File extensions mapping
export const FILE_EXTENSIONS = {
  [OUTPUT_FORMATS.STRUCTURED]: 'txt',
  [OUTPUT_FORMATS.MARKDOWN]: 'md',
  [OUTPUT_FORMATS.HTML]: 'html',
  [OUTPUT_FORMATS.JSON]: 'json',
  [OUTPUT_FORMATS.PLAIN]: 'txt',
  [OUTPUT_FORMATS.PDF]: 'pdf'
};

// MIME types mapping
export const MIME_TYPES = {
  [OUTPUT_FORMATS.STRUCTURED]: 'text/plain',
  [OUTPUT_FORMATS.MARKDOWN]: 'text/markdown',
  [OUTPUT_FORMATS.HTML]: 'text/html',
  [OUTPUT_FORMATS.JSON]: 'application/json',
  [OUTPUT_FORMATS.PLAIN]: 'text/plain',
  [OUTPUT_FORMATS.PDF]: 'application/pdf'
};

// Extraction modes
export const EXTRACTION_MODES = {
  FULL_PAGE: 'fullPage',
  ARTICLE_ONLY: 'articleOnly',
  SELECTED_ELEMENT: 'selectedElement',
  SELECTED_TEXT: 'selectedText'
};

// Element selectors to skip during extraction
export const SKIP_TAGS = [
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'IFRAME',
  'SVG',
  'CANVAS',
  'INPUT',
  'BUTTON',
  'SELECT',
  'TEXTAREA',
  'FORM',
  'VIDEO',
  'AUDIO',
  'EMBED',
  'OBJECT'
];

// Ad and navigation patterns
export const AD_NAV_PATTERNS = [
  // Ads
  'ad-', 'ads-', 'advert', 'advertisement', 'banner', 'promo', 'sponsor',
  // Navigation
  'nav', 'menu', 'sidebar', 'widget', 'header', 'footer',
  // Social
  'social', 'share', 'follow',
  // Comments
  'comment', 'disqus', 'discourse',
  // Related content
  'related', 'recommended', 'popular',
  // Popups
  'popup', 'modal', 'overlay', 'cookie', 'gdpr',
  // Tracking
  'analytics', 'tracking', 'pixel'
];

// Main content selectors (in priority order)
export const MAIN_CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.post-content',
  '.entry-content',
  '.article-content',
  '.article-body',
  '.post-body',
  '.entry-body',
  '.content',
  '.post',
  '.article',
  '.story',
  '#content',
  '#main',
  '#article',
  '[itemprop="articleBody"]',
  '.markdown-body', // GitHub
  '.post-body', // Blogger
  '.entry', // WordPress
  '.prose', // Tailwind Typography
  '.article__content' // Medium-like
];

// Reading speed (words per minute)
export const READING_SPEED = {
  SLOW: 150,
  AVERAGE: 200,
  FAST: 250
};

// Text statistics thresholds
export const TEXT_THRESHOLDS = {
  MIN_ARTICLE_LENGTH: 200, // Minimum characters for article detection
  MAX_FILENAME_LENGTH: 50,
  MAX_HISTORY_ITEMS: 50,
  MAX_ERROR_LOG_ITEMS: 50
};

// UI constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 300,
  NOTIFICATION_DURATION: 3000,
  ANIMATION_DURATION: 300,
  TOOLTIP_DELAY: 500,
  AUTO_SAVE_DELAY: 1000
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  CLEAR: ['Ctrl+K', 'Cmd+K'],
  COPY: ['Ctrl+C', 'Cmd+C'],
  DOWNLOAD: ['Ctrl+S', 'Cmd+S'],
  ESCAPE: ['Escape']
};

// Z-index layers
export const Z_INDEX = {
  OVERLAY: 2147483646,
  TOOLTIP: 2147483647,
  NOTIFICATION: 2147483647,
  MODAL: 2147483648
};

// CSS class names
export const CSS_CLASSES = {
  OVERLAY: 'text-extractor-overlay',
  TOOLTIP: 'text-extractor-tooltip',
  NOTIFICATION: 'text-extractor-notification',
  INSTRUCTIONS: 'text-extractor-instructions',
  HIGHLIGHT: 'text-extractor-highlight',
  LOADING: 'loading',
  HIDDEN: 'hidden',
  ACTIVE: 'active',
  DISABLED: 'disabled'
};

// Message types for chrome.runtime messaging
export const MESSAGE_TYPES = {
  EXTRACT_CONTENT: 'extractContent',
  SELECTED_TEXT: 'selectedText',
  ENABLE_SELECT_MODE: 'enableSelectMode',
  DISABLE_SELECT_MODE: 'disableSelectMode',
  GET_LAST_EXTRACTED: 'getLastExtracted',
  SAVE_PREFERENCES: 'savePreferences',
  GET_PREFERENCES: 'getPreferences',
  CLEAR_HISTORY: 'clearHistory',
  EXPORT_DATA: 'exportData'
};

// Context menu IDs
export const CONTEXT_MENU_IDS = {
  EXTRACT_SELECTION: 'extractSelection',
  EXTRACT_PAGE: 'extractPage',
  EXTRACT_ELEMENT: 'extractElement',
  COPY_AS_MARKDOWN: 'copyAsMarkdown',
  COPY_AS_PLAIN: 'copyAsPlain',
  SEPARATOR: 'separator1'
};

// Error messages
export const ERROR_MESSAGES = {
  EXTRACTION_FAILED: 'Failed to extract content. Please try refreshing the page.',
  COPY_FAILED: 'Failed to copy to clipboard.',
  DOWNLOAD_FAILED: 'Failed to download file.',
  INVALID_FORMAT: 'Invalid output format selected.',
  NO_CONTENT: 'No content to process.',
  PERMISSION_DENIED: 'Permission denied. Please check extension permissions.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  EXTRACTED: 'Content extracted successfully!',
  COPIED: 'Copied to clipboard!',
  DOWNLOADED: 'File downloaded successfully!',
  SAVED: 'Preferences saved!',
  CLEARED: 'Content cleared!'
};

// Themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Color schemes
export const COLORS = {
  PRIMARY: '#6366f1',
  PRIMARY_DARK: '#4f46e5',
  PRIMARY_LIGHT: '#818cf8',
  SECONDARY: '#64748b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6'
};

// Export format icons (SVG paths)
export const FORMAT_ICONS = {
  [OUTPUT_FORMATS.STRUCTURED]: 'M3 6h18M3 12h18M3 18h18',
  [OUTPUT_FORMATS.MARKDOWN]: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
  [OUTPUT_FORMATS.HTML]: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  [OUTPUT_FORMATS.JSON]: 'M16 18l6-6-6-6M8 6l-6 6 6 6M12 2v20',
  [OUTPUT_FORMATS.PLAIN]: 'M17 6.1H3M21 12.1H3M15.1 18H3',
  [OUTPUT_FORMATS.PDF]: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
};

// Regular expressions
export const REGEX = {
  URL: /^https?:\/\/.+/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  WHITESPACE: /\s+/g,
  MULTIPLE_NEWLINES: /\n{3,}/g,
  HEADING: /^#{1,6}\s+(.+)$/gm,
  LIST_ITEM: /^[\*\-\+]\s+(.+)$/gm,
  ORDERED_LIST: /^\d+\.\s+(.+)$/gm,
  CODE_BLOCK: /```[\s\S]*?```/g,
  INLINE_CODE: /`[^`]+`/g,
  LINK: /\[([^\]]+)\]\(([^\)]+)\)/g,
  IMAGE: /!\[([^\]]*)\]\(([^\)]+)\)/g
};

// Feature flags
export const FEATURES = {
  DARK_MODE: true,
  PDF_EXPORT: true,
  BATCH_EXTRACTION: true,
  CUSTOM_TEMPLATES: true,
  HISTORY: true,
  CLOUD_SYNC: false, // Future feature
  AI_SUMMARY: false, // Future feature
  OCR: false // Future feature
};

// API endpoints (for future features)
export const API_ENDPOINTS = {
  SYNC: '/api/sync',
  TEMPLATES: '/api/templates',
  FEEDBACK: '/api/feedback'
};

// Performance settings
export const PERFORMANCE = {
  MAX_CONTENT_SIZE: 10 * 1024 * 1024, // 10MB
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large content
  MAX_CONCURRENT_EXTRACTIONS: 3,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// Accessibility
export const A11Y = {
  ARIA_LABELS: {
    EXTRACT_BUTTON: 'Extract content from page',
    COPY_BUTTON: 'Copy extracted content to clipboard',
    DOWNLOAD_BUTTON: 'Download extracted content',
    CLEAR_BUTTON: 'Clear extracted content',
    FORMAT_SELECTOR: 'Select output format',
    OPTIONS_TOGGLE: 'Toggle extraction options'
  },
  KEYBOARD_NAVIGATION: true,
  HIGH_CONTRAST: false
};

// Development/Debug
export const DEBUG = {
  ENABLED: false, // Set to true for development
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  PERFORMANCE_MONITORING: false
};

// Export all as default for convenience
export default {
  EXTENSION_NAME,
  EXTENSION_VERSION,
  EXTENSION_ID,
  STORAGE_KEYS,
  DEFAULT_OPTIONS,
  OUTPUT_FORMATS,
  FILE_EXTENSIONS,
  MIME_TYPES,
  EXTRACTION_MODES,
  SKIP_TAGS,
  AD_NAV_PATTERNS,
  MAIN_CONTENT_SELECTORS,
  READING_SPEED,
  TEXT_THRESHOLDS,
  UI,
  KEYBOARD_SHORTCUTS,
  Z_INDEX,
  CSS_CLASSES,
  MESSAGE_TYPES,
  CONTEXT_MENU_IDS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  THEMES,
  COLORS,
  FORMAT_ICONS,
  REGEX,
  FEATURES,
  API_ENDPOINTS,
  PERFORMANCE,
  A11Y,
  DEBUG
};
