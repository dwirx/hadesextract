/**
 * ============================================
 * Text Extractor Pro - Options Page
 * Settings management interface
 * ============================================
 */

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'auto',
  preserveStructure: true,
  includeTables: true,
  includeLinks: false,
  includeImages: false,
  cleanWhitespace: true,
  removeAds: true,
  defaultFormat: 'structured',
  showNotifications: true
};

// DOM Elements
const elements = {
  themeSelect: document.getElementById('themeSelect'),
  preserveStructure: document.getElementById('preserveStructure'),
  includeTables: document.getElementById('includeTables'),
  includeLinks: document.getElementById('includeLinks'),
  includeImages: document.getElementById('includeImages'),
  cleanWhitespace: document.getElementById('cleanWhitespace'),
  removeAds: document.getElementById('removeAds'),
  defaultFormat: document.getElementById('defaultFormat'),
  showNotifications: document.getElementById('showNotifications'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  statusMessage: document.getElementById('statusMessage')
};

/**
 * Loads settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings = { ...DEFAULT_SETTINGS, ...result.settings };
    
    // Apply settings to UI
    elements.themeSelect.value = settings.theme;
    elements.preserveStructure.checked = settings.preserveStructure;
    elements.includeTables.checked = settings.includeTables;
    elements.includeLinks.checked = settings.includeLinks;
    elements.includeImages.checked = settings.includeImages;
    elements.cleanWhitespace.checked = settings.cleanWhitespace;
    elements.removeAds.checked = settings.removeAds;
    elements.defaultFormat.value = settings.defaultFormat;
    elements.showNotifications.checked = settings.showNotifications;
    
    // Apply theme
    applyTheme(settings.theme);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Saves settings to storage
 */
async function saveSettings() {
  try {
    const settings = {
      theme: elements.themeSelect.value,
      preserveStructure: elements.preserveStructure.checked,
      includeTables: elements.includeTables.checked,
      includeLinks: elements.includeLinks.checked,
      includeImages: elements.includeImages.checked,
      cleanWhitespace: elements.cleanWhitespace.checked,
      removeAds: elements.removeAds.checked,
      defaultFormat: elements.defaultFormat.value,
      showNotifications: elements.showNotifications.checked
    };
    
    await chrome.storage.local.set({ settings });
    
    // Apply theme
    applyTheme(settings.theme);
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Resets settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  try {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
}

/**
 * Shows status message
 * @param {string} message - Message to show
 * @param {string} type - Message type (success/error)
 */
function showStatus(message, type = 'success') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type} show`;
  
  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
  }, 3000);
}

/**
 * Applies theme to options page
 * @param {string} theme - Theme to apply
 */
function applyTheme(theme) {
  const root = document.documentElement;
  
  // Determine effective theme
  let effectiveTheme = theme;
  if (theme === 'auto') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Remove existing theme classes
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${effectiveTheme}`);
  
  // Apply theme variables
  if (effectiveTheme === 'dark') {
    root.style.setProperty('--primary', '#818cf8');
    root.style.setProperty('--primary-dark', '#6366f1');
    root.style.setProperty('--success', '#34d399');
    root.style.setProperty('--bg-primary', '#0f172a');
    root.style.setProperty('--bg-secondary', '#1e293b');
    root.style.setProperty('--text-primary', '#f1f5f9');
    root.style.setProperty('--text-secondary', '#cbd5e1');
    root.style.setProperty('--border', '#334155');
  } else {
    root.style.setProperty('--primary', '#6366f1');
    root.style.setProperty('--primary-dark', '#4f46e5');
    root.style.setProperty('--success', '#10b981');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8fafc');
    root.style.setProperty('--text-primary', '#1e293b');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--border', '#e2e8f0');
  }
}

/**
 * Initializes options page
 */
async function init() {
  // Load settings
  await loadSettings();
  
  // Event listeners
  elements.saveBtn.addEventListener('click', saveSettings);
  elements.resetBtn.addEventListener('click', resetSettings);
  
  // Theme change listener
  elements.themeSelect.addEventListener('change', () => {
    applyTheme(elements.themeSelect.value);
  });
  
  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (elements.themeSelect.value === 'auto') {
        applyTheme('auto');
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
