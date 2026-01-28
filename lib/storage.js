// ============================================
// Text Extractor Pro - Storage Utilities
// Modern async/await wrapper for chrome.storage
// ============================================

const Storage = {
  /**
   * Get data from local storage
   * @param {string|string[]} keys - Key(s) to retrieve
   * @returns {Promise<object>} - Retrieved data
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Set data to local storage
   * @param {object} data - Data to store
   * @returns {Promise<void>}
   */
  async set(data) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Remove data from local storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Clear all local storage
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Get sync storage (syncs across devices)
   * @param {string|string[]} keys - Key(s) to retrieve
   * @returns {Promise<object>}
   */
  async getSync(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Set sync storage
   * @param {object} data - Data to store
   * @returns {Promise<void>}
   */
  async setSync(data) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Watch for storage changes
   * @param {function} callback - Callback function (changes, areaName)
   * @returns {function} - Unsubscribe function
   */
  onChange(callback) {
    const listener = (changes, areaName) => {
      callback(changes, areaName);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
};

// Default settings
const DEFAULT_SETTINGS = {
  preserveStructure: true,
  includeTables: true,
  includeLinks: false,
  includeImages: false,
  cleanWhitespace: true,
  removeAds: true,
  format: 'structured',
  theme: 'system', // 'light', 'dark', 'system'
  autoClose: false,
  showNotifications: true,
  textareaHeight: '200px'
};

/**
 * Get settings with defaults
 * @returns {Promise<object>}
 */
async function getSettings() {
  try {
    const result = await Storage.get('settings');
    return { ...DEFAULT_SETTINGS, ...result.settings };
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings
 * @param {object} settings - Settings to save
 * @returns {Promise<void>}
 */
async function saveSettings(settings) {
  try {
    const current = await getSettings();
    await Storage.set({ settings: { ...current, ...settings } });
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.Storage = Storage;
  window.getSettings = getSettings;
  window.saveSettings = saveSettings;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
}
