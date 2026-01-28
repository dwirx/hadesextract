/**
 * ============================================
 * Text Extractor Pro - Theme Manager
 * Dark mode and theme switching support
 * ============================================
 */

import { THEMES, STORAGE_KEYS } from './constants.js';

/**
 * Theme Manager class
 */
class ThemeManager {
  constructor() {
    this.currentTheme = THEMES.AUTO;
    this.listeners = new Set();
    this.init();
  }
  
  /**
   * Initializes theme manager
   */
  async init() {
    // Load saved theme
    await this.loadTheme();
    
    // Apply theme
    this.applyTheme();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentTheme === THEMES.AUTO) {
          this.applyTheme();
        }
      });
    }
  }
  
  /**
   * Loads theme from storage
   */
  async loadTheme() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
        this.currentTheme = result[STORAGE_KEYS.THEME] || THEMES.AUTO;
      } else {
        // Fallback to localStorage
        this.currentTheme = localStorage.getItem('theme') || THEMES.AUTO;
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.currentTheme = THEMES.AUTO;
    }
  }
  
  /**
   * Saves theme to storage
   */
  async saveTheme() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: this.currentTheme });
      } else {
        // Fallback to localStorage
        localStorage.setItem('theme', this.currentTheme);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }
  
  /**
   * Gets effective theme (resolves AUTO to light/dark)
   * @returns {string} Effective theme
   */
  getEffectiveTheme() {
    if (this.currentTheme === THEMES.AUTO) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return THEMES.DARK;
      }
      return THEMES.LIGHT;
    }
    return this.currentTheme;
  }
  
  /**
   * Applies current theme
   */
  applyTheme() {
    const effectiveTheme = this.getEffectiveTheme();
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');
    
    // Add new theme class
    root.classList.add(`theme-${effectiveTheme}`);
    
    // Set data attribute
    root.setAttribute('data-theme', effectiveTheme);
    
    // Apply CSS variables
    if (effectiveTheme === THEMES.DARK) {
      this.applyDarkTheme();
    } else {
      this.applyLightTheme();
    }
    
    // Notify listeners
    this.notifyListeners(effectiveTheme);
  }
  
  /**
   * Applies light theme variables
   */
  applyLightTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#6366f1');
    root.style.setProperty('--primary-dark', '#4f46e5');
    root.style.setProperty('--primary-light', '#818cf8');
    root.style.setProperty('--secondary', '#64748b');
    root.style.setProperty('--success', '#10b981');
    root.style.setProperty('--warning', '#f59e0b');
    root.style.setProperty('--error', '#ef4444');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8fafc');
    root.style.setProperty('--bg-tertiary', '#f1f5f9');
    root.style.setProperty('--text-primary', '#1e293b');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--border', '#e2e8f0');
    root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1)');
  }
  
  /**
   * Applies dark theme variables
   */
  applyDarkTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#818cf8');
    root.style.setProperty('--primary-dark', '#6366f1');
    root.style.setProperty('--primary-light', '#a5b4fc');
    root.style.setProperty('--secondary', '#94a3b8');
    root.style.setProperty('--success', '#34d399');
    root.style.setProperty('--warning', '#fbbf24');
    root.style.setProperty('--error', '#f87171');
    root.style.setProperty('--bg-primary', '#0f172a');
    root.style.setProperty('--bg-secondary', '#1e293b');
    root.style.setProperty('--bg-tertiary', '#334155');
    root.style.setProperty('--text-primary', '#f1f5f9');
    root.style.setProperty('--text-secondary', '#cbd5e1');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--border', '#334155');
    root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.5)');
  }
  
  /**
   * Sets theme
   * @param {string} theme - Theme to set
   */
  async setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
      console.error('Invalid theme:', theme);
      return;
    }
    
    this.currentTheme = theme;
    await this.saveTheme();
    this.applyTheme();
  }
  
  /**
   * Toggles between light and dark theme
   */
  async toggle() {
    const effectiveTheme = this.getEffectiveTheme();
    const newTheme = effectiveTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    await this.setTheme(newTheme);
  }
  
  /**
   * Gets current theme
   * @returns {string} Current theme
   */
  getTheme() {
    return this.currentTheme;
  }
  
  /**
   * Checks if dark mode is active
   * @returns {boolean} Is dark mode
   */
  isDark() {
    return this.getEffectiveTheme() === THEMES.DARK;
  }
  
  /**
   * Adds theme change listener
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * Notifies all listeners
   * @param {string} theme - New theme
   */
  notifyListeners(theme) {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export singleton
export default themeManager;

// Export convenience functions
export const setTheme = (theme) => themeManager.setTheme(theme);
export const toggleTheme = () => themeManager.toggle();
export const getTheme = () => themeManager.getTheme();
export const isDarkMode = () => themeManager.isDark();
export const onThemeChange = (callback) => themeManager.onChange(callback);

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.themeManager = themeManager;
  window.setTheme = setTheme;
  window.toggleTheme = toggleTheme;
  window.getTheme = getTheme;
  window.isDarkMode = isDarkMode;
}
