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
  showNotifications: true,
  openrouterApiKey: '',
  openrouterModel: 'openai/gpt-5-nano',
  modelSort: 'newest',
  modelPriceFilter: 'all'
};
const LOCAL_SETTINGS_KEY = 'text_extractor_settings';

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
  openrouterApiKey: document.getElementById('openrouterApiKey'),
  openrouterModel: document.getElementById('openrouterModel'),
  modelSort: document.getElementById('modelSort'),
  modelPriceFilter: document.getElementById('modelPriceFilter'),
  modelSearch: document.getElementById('modelSearch'),
  refreshModelsBtn: document.getElementById('refreshModelsBtn'),
  modelListSelect: document.getElementById('modelListSelect'),
  modelListMeta: document.getElementById('modelListMeta'),
  modelListContainer: document.getElementById('modelListContainer'),
  selectedModelInfo: document.getElementById('selectedModelInfo'),
  toggleApiVisibilityBtn: document.getElementById('toggleApiVisibilityBtn'),
  testApiBtn: document.getElementById('testApiBtn'),
  storageBadge: document.getElementById('storageBadge'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  statusMessage: document.getElementById('statusMessage')
};

let cachedModels = [];

/**
 * Loads settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('settings');
    const localSettings = readSettingsFromLocalStorage();
    const settings = { ...DEFAULT_SETTINGS, ...(result.settings || {}), ...localSettings };
    
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
    elements.openrouterApiKey.value = settings.openrouterApiKey || '';
    elements.openrouterModel.value = settings.openrouterModel || 'openai/gpt-5-nano';
    elements.modelSort.value = settings.modelSort || 'newest';
    elements.modelPriceFilter.value = settings.modelPriceFilter || 'all';
    elements.modelSearch.value = '';
    updateStorageBadge(settings);
    updateSelectedModelInfo(settings.openrouterModel);
    
    // Apply theme
    applyTheme(settings.theme);
    await refreshModelList();
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
      showNotifications: elements.showNotifications.checked,
      openrouterApiKey: (elements.openrouterApiKey.value || '').trim(),
      openrouterModel: (elements.openrouterModel.value || '').trim() || 'openai/gpt-5-nano',
      modelSort: elements.modelSort.value,
      modelPriceFilter: elements.modelPriceFilter.value
    };
    
    await chrome.storage.local.set({ settings });
    writeSettingsToLocalStorage(settings);
    
    // Apply theme
    applyTheme(settings.theme);
    updateStorageBadge(settings);
    
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
    clearLocalSettings();
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

function readSettingsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Failed to read localStorage settings:', error);
    return {};
  }
}

function writeSettingsToLocalStorage(settings) {
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to write localStorage settings:', error);
  }
}

function clearLocalSettings() {
  try {
    localStorage.removeItem(LOCAL_SETTINGS_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage settings:', error);
  }
}

function updateStorageBadge(settings) {
  if (!elements.storageBadge) return;
  const hasApiKey = Boolean((settings.openrouterApiKey || '').trim());
  elements.storageBadge.textContent = hasApiKey
    ? 'Storage: API key tersimpan di chrome.storage.local + localStorage'
    : 'Storage: chrome.storage.local + localStorage (API key belum diisi)';
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function getPromptCompletionPricing(model) {
  const pricing = model.pricing || {};
  return {
    prompt: toNumber(pricing.prompt),
    completion: toNumber(pricing.completion)
  };
}

function isFreeModel(model) {
  const { prompt, completion } = getPromptCompletionPricing(model);
  return Number.isFinite(prompt) && Number.isFinite(completion) && prompt === 0 && completion === 0;
}

function isZeroPriceModel(model) {
  const { prompt, completion } = getPromptCompletionPricing(model);
  const promptZero = Number.isFinite(prompt) && prompt === 0;
  const completionZero = Number.isFinite(completion) && completion === 0;
  return promptZero || completionZero;
}

function getCreatedTimestamp(model) {
  const raw = typeof model.created === 'number'
    ? model.created
    : typeof model.created_at === 'number'
      ? model.created_at
      : typeof model.createdAt === 'number'
        ? model.createdAt
        : 0;
  if (!raw) return 0;
  return raw > 1_000_000_000_000 ? Math.floor(raw / 1000) : raw;
}

function getCreatedAtDate(model) {
  const ts = getCreatedTimestamp(model);
  if (!ts) return null;
  const date = new Date(ts * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForLabel(model) {
  const date = getCreatedAtDate(model);
  if (!date) return 'unknown date';
  return date.toLocaleDateString();
}

function getModelLabel(model) {
  const name = model.name || model.id || 'unknown-model';
  return `${name} (${model.id || 'no-id'}) - ${formatDateForLabel(model)}`;
}

function getModelProvider(model) {
  const provider = model.top_provider || model.provider || '';
  return typeof provider === 'string' && provider.trim() ? provider : 'provider ?';
}

function formatPriceValue(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return '?';
  if (n === 0) return '0';
  return n.toExponential(2);
}

function getPriceTag(model) {
  const pricing = model.pricing || {};
  const prompt = formatPriceValue(pricing.prompt);
  const completion = formatPriceValue(pricing.completion);
  return `p:${prompt} c:${completion}`;
}

function updateSelectedModelInfo(modelId) {
  if (!elements.selectedModelInfo) return;
  const finalModel = (modelId || '').trim() || 'openai/gpt-5-nano';
  elements.selectedModelInfo.textContent = `Model aktif: ${finalModel}`;
}

function selectModel(modelId) {
  if (!modelId) return;
  elements.openrouterModel.value = modelId;

  const options = Array.from(elements.modelListSelect.options);
  const match = options.find(opt => opt.value === modelId);
  if (match) {
    elements.modelListSelect.value = modelId;
  }

  updateSelectedModelInfo(modelId);
  renderModelList();
  showStatus('Model dipilih. Klik Save Settings untuk menyimpan.', 'success');
}

function filterModels(models) {
  const keyword = (elements.modelSearch.value || '').trim().toLowerCase();
  const priceFilter = elements.modelPriceFilter.value;
  let result = models;

  if (priceFilter === 'free') result = result.filter(isFreeModel);
  if (priceFilter === 'zero') result = result.filter(isZeroPriceModel);

  if (keyword) {
    result = result.filter(model => {
      const name = (model.name || '').toLowerCase();
      const id = (model.id || '').toLowerCase();
      return name.includes(keyword) || id.includes(keyword);
    });
  }

  return result;
}

function sortModels(models) {
  const sortType = elements.modelSort.value;
  const sorted = [...models];
  sorted.sort((a, b) => {
    const ta = getCreatedTimestamp(a);
    const tb = getCreatedTimestamp(b);
    return sortType === 'oldest' ? ta - tb : tb - ta;
  });
  return sorted;
}

function renderModelList() {
  const filtered = sortModels(filterModels(cachedModels));
  const currentModel = (elements.openrouterModel.value || '').trim();

  elements.modelListSelect.innerHTML = '';

  if (!filtered.length) {
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = 'Tidak ada model sesuai filter';
    elements.modelListSelect.appendChild(emptyOpt);
    elements.modelListMeta.textContent = `0 model ditampilkan (total ${cachedModels.length}).`;
    return;
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Pilih model...';
  elements.modelListSelect.appendChild(placeholder);

  for (const model of filtered) {
    const option = document.createElement('option');
    option.value = model.id || '';
    option.textContent = getModelLabel(model);
    if (option.value && option.value === currentModel) {
      option.selected = true;
    }
    elements.modelListSelect.appendChild(option);
  }

  elements.modelListMeta.textContent = `${filtered.length} model ditampilkan (total ${cachedModels.length}).`;
  updateSelectedModelInfo(currentModel);
  renderModelRows(filtered, currentModel);
}

function renderModelRows(models, currentModel) {
  if (!elements.modelListContainer) return;
  elements.modelListContainer.innerHTML = '';

  if (!models.length) {
    elements.modelListContainer.innerHTML = '<div class="model-row"><div class="model-main"><div class="model-name">Tidak ada model yang cocok</div><div class="model-id">Coba ganti filter/sort atau kata kunci.</div></div></div>';
    return;
  }

  const maxRows = Math.min(models.length, 60);
  for (let i = 0; i < maxRows; i += 1) {
    const model = models[i];
    const row = document.createElement('div');
    row.className = 'model-row';

    const main = document.createElement('div');
    main.className = 'model-main';

    const name = document.createElement('div');
    name.className = 'model-name';
    name.textContent = model.name || model.id || 'unknown-model';

    const id = document.createElement('div');
    id.className = 'model-id';
    id.textContent = model.id || 'no-id';

    main.appendChild(name);
    main.appendChild(id);

    const provider = document.createElement('div');
    provider.className = 'model-pill';
    provider.textContent = getModelProvider(model);

    const price = document.createElement('div');
    const free = isFreeModel(model);
    price.className = `model-pill${free ? ' free' : ''}`;
    price.textContent = free ? 'FREE' : getPriceTag(model);

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'model-select-btn';
    selectBtn.textContent = model.id === currentModel ? 'Dipilih' : 'Pilih';
    selectBtn.addEventListener('click', () => selectModel(model.id || ''));

    row.appendChild(main);
    row.appendChild(provider);
    row.appendChild(price);
    row.appendChild(selectBtn);

    elements.modelListContainer.appendChild(row);
  }
}

async function refreshModelList() {
  elements.modelListMeta.textContent = 'Memuat model dari OpenRouter...';
  elements.refreshModelsBtn.disabled = true;

  try {
    const apiKey = (elements.openrouterApiKey.value || '').trim();
    const headers = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = payload?.error?.message || `Gagal memuat models (${response.status})`;
      throw new Error(msg);
    }

    cachedModels = Array.isArray(payload?.data) ? payload.data : [];
    renderModelList();
  } catch (error) {
    console.error('Failed to load OpenRouter models:', error);
    elements.modelListMeta.textContent = `Gagal memuat model: ${error.message}`;
  } finally {
    elements.refreshModelsBtn.disabled = false;
  }
}

function toggleApiVisibility() {
  const isPassword = elements.openrouterApiKey.type === 'password';
  elements.openrouterApiKey.type = isPassword ? 'text' : 'password';
  elements.toggleApiVisibilityBtn.textContent = isPassword ? 'Hide' : 'Show';
}

async function testApiConnection() {
  const apiKey = (elements.openrouterApiKey.value || '').trim();
  const model = (elements.openrouterModel.value || '').trim() || 'openai/gpt-5-nano';

  if (!apiKey) {
    showStatus('Isi API key dulu sebelum test koneksi.', 'error');
    return;
  }

  elements.testApiBtn.disabled = true;
  elements.testApiBtn.textContent = 'Testing...';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = payload?.error?.message || `Koneksi gagal (${response.status})`;
      throw new Error(msg);
    }

    showStatus('Koneksi API berhasil.', 'success');
  } catch (error) {
    console.error('API test failed:', error);
    showStatus(`API error: ${error.message}`, 'error');
  } finally {
    elements.testApiBtn.disabled = false;
    elements.testApiBtn.textContent = 'Test API';
  }
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
  elements.refreshModelsBtn.addEventListener('click', refreshModelList);
  elements.toggleApiVisibilityBtn.addEventListener('click', toggleApiVisibility);
  elements.testApiBtn.addEventListener('click', testApiConnection);
  elements.modelSort.addEventListener('change', renderModelList);
  elements.modelPriceFilter.addEventListener('change', renderModelList);
  elements.modelSearch.addEventListener('input', renderModelList);
  elements.openrouterModel.addEventListener('input', () => {
    updateSelectedModelInfo(elements.openrouterModel.value);
  });
  elements.modelListSelect.addEventListener('change', () => {
    if (elements.modelListSelect.value) {
      selectModel(elements.modelListSelect.value);
    }
  });
  
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
