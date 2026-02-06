import { db } from './utils/index.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const extractAllBtn = document.getElementById('extractAll');
  const extractArticleBtn = document.getElementById('extractArticle');
  const selectElementBtn = document.getElementById('selectElement');

  const resultSection = document.getElementById('resultSection');
  const resultText = document.getElementById('resultText');
  const resultDisplay = document.getElementById('resultDisplay');

  // View Toggle & History
  const viewExtractorBtn = document.getElementById('viewExtractorBtn');
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Extractor Controls Container (to hide when showing history)
  const controlsContainer = document.querySelector('.flex-none.flex.flex-col.gap-3');


  const statusEl = document.getElementById('status');
  const pageInfo = document.getElementById('pageInfo');

  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const reformatBtn = document.getElementById('reformatBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Stats
  const charCount = document.getElementById('charCount');
  const wordCount = document.getElementById('wordCount');
  const sentenceCount = document.getElementById('sentenceCount');
  const readingTime = document.getElementById('readingTime');

  let currentData = null;

  // Initialize
  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    pageInfo.textContent = tab.title || 'Ready';

    // 1. Get global last extracted data
    const storage = await chrome.storage.local.get(['lastExtractedData']);
    let candidate = null;
    let source = null;

    if (storage.lastExtractedData && storage.lastExtractedData.url === tab.url) {
      candidate = storage.lastExtractedData;
      source = 'storage';
    }

    // 2. If no fresh storage data for this tab, check history
    if (!candidate) {
      const historyItems = await db.getAll();
      // Find newest item for this URL
      candidate = historyItems.find(item => item.url === tab.url);
      source = 'history';
    }

    if (candidate) {
      currentData = candidate;
      displayResult(currentData);

      // If it came from storage (e.g. context menu) and NOT history,
      // save it to history so it persists
      if (source === 'storage') {
         const historyItems = await db.getAll();
         const mostRecent = historyItems[0];
         // Basic duplicate check
         const isDuplicate = mostRecent && mostRecent.url === candidate.url && mostRecent.text === candidate.text;

         if (!isDuplicate) {
             db.add({
              title: candidate.title,
              text: candidate.text,
              url: candidate.url || '',
              format: 'txt'
            }).catch(console.error);
         }
      }
    }
  })();

  // Button Listeners
  extractAllBtn.addEventListener('click', () => extract('full'));
  extractArticleBtn.addEventListener('click', () => extract('article', true));
  selectElementBtn.addEventListener('click', toggleSelectMode);

  copyBtn.addEventListener('click', copyToClipboard);
  reformatBtn.addEventListener('click', () => {
    if (currentData) displayResult(currentData);
  });
  clearBtn.addEventListener('click', clearResult);

  // Fix: Attach download listener explicitly to the main download button
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const format = getFormat() || 'txt';
      downloadResult(format);
    });
  }

  // Helper to sanitize filenames
  function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  // View Switching
  viewExtractorBtn.addEventListener('click', () => switchView('extractor'));
  viewHistoryBtn.addEventListener('click', () => switchView('history'));

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Delete all history?')) {
      await db.clear();
      renderHistory();
    }
  });

  async function switchView(view) {
    if (view === 'extractor') {
      historySection.classList.add('hidden');
      controlsContainer.classList.remove('hidden');
      if (currentData) resultSection.classList.remove('hidden');

      viewExtractorBtn.classList.replace('text-slate-500', 'text-slate-700');
      viewExtractorBtn.classList.replace('font-medium', 'font-bold');
      viewExtractorBtn.classList.add('bg-white', 'shadow-sm');

      viewHistoryBtn.classList.replace('text-slate-700', 'text-slate-500');
      viewHistoryBtn.classList.replace('font-bold', 'font-medium');
      viewHistoryBtn.classList.remove('bg-white', 'shadow-sm');
    } else {
      controlsContainer.classList.add('hidden');
      resultSection.classList.add('hidden');
      historySection.classList.remove('hidden');

      viewHistoryBtn.classList.replace('text-slate-500', 'text-slate-700');
      viewHistoryBtn.classList.replace('font-medium', 'font-bold');
      viewHistoryBtn.classList.add('bg-white', 'shadow-sm');

      viewExtractorBtn.classList.replace('text-slate-700', 'text-slate-500');
      viewExtractorBtn.classList.replace('font-bold', 'font-medium');
      viewExtractorBtn.classList.remove('bg-white', 'shadow-sm');

      await renderHistory();
    }
  }

  async function renderHistory() {
    const items = await db.getAll();
    historyList.innerHTML = '';

    if (items.length === 0) {
      historyList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-300 gap-2 mt-10">
                <svg class="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path></svg>
                <div class="text-xs font-medium">No history yet</div>
            </div>`;
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'group flex flex-col p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer';
      el.innerHTML = `
             <div class="flex items-start justify-between mb-1">
                 <h3 class="font-bold text-xs text-slate-700 line-clamp-1 break-all">${item.title || 'Untitled'}</h3>
                 <span class="text-[9px] text-slate-400 whitespace-nowrap ml-2">${new Date(item.createdAt).toLocaleDateString()}</span>
             </div>
             <p class="text-[10px] text-slate-500 line-clamp-2 mb-2 font-mono bg-slate-50 p-1.5 rounded-md border border-slate-100/50">${item.text.substring(0, 150)}</p>
             <div class="flex items-center justify-between mt-auto">
                 <span class="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">${item.format || 'TXT'}</span>
                 <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button class="delete-btn p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                     </button>
                 </div>
             </div>
          `;

      // Load Click
      el.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) return;
        currentData = item;
        displayResult(item);
        switchView('extractor');
      });

      // Delete Click
      el.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await db.delete(item.id);
        renderHistory();
      });

      historyList.appendChild(el);
    });
  }

  // Button Listeners
  // Removed old comment: Options Listeners (Re-extract on format change?)

  const formatInputs = document.querySelectorAll('input[name="format"]');
  formatInputs.forEach(input => {
    input.addEventListener('change', () => {
      // Auto-refresh if data is present and we are viewing it
      if (!resultSection.classList.contains('hidden') && currentData) {
        extract(currentData.mode === 'full' ? 'full' : 'article', currentData.articleOnly);
      }
    });
  });

  async function checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      pageInfo.textContent = tab.title || 'Ready';
    }
  }

  function getOptions() {
    return {
      preserveStructure: document.getElementById('preserveStructure').checked,
      includeTables: document.getElementById('includeTables').checked,
      includeLinks: document.getElementById('includeLinks').checked,
      includeImages: document.getElementById('includeImages').checked,
      cleanWhitespace: document.getElementById('cleanWhitespace').checked,
      removeAds: document.getElementById('removeAds').checked
    };
  }

  function getFormat() {
    return document.querySelector('input[name="format"]:checked').value;
  }

  async function ensureConnection(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      if (response && response.status === 'alive') return true;
    } catch (e) {
      // Ignore error, just means we need to inject
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.bundle.js']
      });
      // Wait for script to initialize
      await new Promise(r => setTimeout(r, 600));
      return true;
    } catch (e) {
      console.error('Injection failed:', e);
      return false;
    }
  }

  async function extract(mode, articleOnly = false) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      showStatus('Cannot extract from browser pages.', 'text-red-600 bg-red-50');
      return;
    }

    showStatus('Connecting...', 'text-indigo-600 bg-indigo-50');

    // Ensure connection first (silent retry)
    const isConnected = await ensureConnection(tab.id);
    if (!isConnected) {
      showStatus('Connection failed. Please refresh.', 'text-red-600 bg-red-50');
      return;
    }

    showStatus('Extracting...', 'text-indigo-600 bg-indigo-50');

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extract',
        mode: mode,
        articleOnly: articleOnly,
        format: getFormat(),
        options: getOptions()
      });

      if (response && response.success) {
        currentData = response.data; // { title, text, html, url }

        // Save to local storage for persistence across popup reopens
        chrome.storage.local.set({ lastExtractedData: currentData });

        // Auto-save to History
        db.add({
          title: currentData.title,
          text: currentData.text,
          url: currentData.url || '',
          format: getFormat()
        }).catch(err => console.error('Failed to save history:', err));

        displayResult(currentData);
        showStatus('Success!', 'text-emerald-600 bg-emerald-50');
        setTimeout(() => statusEl.classList.add('hidden'), 2000);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      showStatus('Error: ' + err.message, 'text-red-600 bg-red-50');
    }
  }

  async function toggleSelectMode() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      alert('Cannot select on browser pages.');
      return;
    }

    window.close(); // Close popup to let user select

    const isConnected = await ensureConnection(tab.id);
    if (!isConnected) {
      alert('Could not connect to page. Please refresh.');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'enableSelectMode' });
  }

  function displayResult(data) {
    const text = data.text;

    // Fallback for copy
    resultText.value = text;

    // Update Rich Display
    // We treat 'text' as raw text for now, but we can enhance if needed
    resultDisplay.textContent = text;

    // Update stats
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentenceCount = text.trim() ? text.split(/[.!?]+/).length - 1 : 0;
    const readingTime = Math.ceil(wordCount / 200);

    document.getElementById('charCount').textContent = charCount.toLocaleString();
    document.getElementById('wordCount').textContent = wordCount.toLocaleString();
    document.getElementById('sentenceCount').textContent = sentenceCount.toLocaleString();
    document.getElementById('readingTime').textContent = readingTime;

    resultSection.classList.remove('hidden');
    pageInfo.textContent = data.title || 'Ready';
  }

  function clearResult() {
    resultText.value = '';
    resultDisplay.textContent = ''; // Clear display
    resultSection.classList.add('hidden');
    statusEl.classList.add('hidden');
  }

  function showStatus(msg, classes) {
    statusEl.textContent = msg;
    statusEl.className = `p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${classes}`;
    statusEl.classList.remove('hidden');
  }

  async function copyToClipboard() {
    if (!currentData || !currentData.text) return;

    try {
      await navigator.clipboard.writeText(currentData.text);
      showStatus('Copied to clipboard!', 'text-emerald-600 bg-emerald-50');
      setTimeout(() => statusEl.classList.add('hidden'), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback
      resultText.value = currentData.text;
      resultText.select();
      document.execCommand('copy');
      showStatus('Copied (fallback)!', 'text-amber-600 bg-amber-50');
    }
  }

  function downloadResult(format) {
    if (!resultText.value) return;

    let extension = 'txt';
    let mimeType = 'text/plain';

    switch (format) {
      case 'markdown':
      case 'obsidian':
        extension = 'md';
        mimeType = 'text/markdown';
        break;
      case 'html':
        extension = 'html';
        mimeType = 'text/html';
        break;
      case 'json':
        extension = 'json';
        mimeType = 'application/json';
        break;
      case 'structured':
        extension = 'txt';
        break;
      case 'plain':
      default:
        extension = 'txt';
        break;
    }

    // Create a meaningful filename
    const title = currentData && currentData.title ? sanitizeFilename(currentData.title) : 'extracted_text';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${title}_${timestamp}.${extension}`;

    const blob = new Blob([resultText.value], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'selectedText') {
      // Handle selection logic if needed
    }
  });

  // ==========================================
  // Custom Resizing Logic
  // ==========================================
  // ==========================================
  // Ultimate Resizing Logic (Omni-Directional)
  // ==========================================
  let isResizing = false;
  let currentResizeMode = null; // 'both', 'bottom', 'left', 'right'

  // Set initial size
  const savedSize = localStorage.getItem('popupSize');
  if (savedSize) {
    const { width, height } = JSON.parse(savedSize);
    document.body.style.width = width + 'px';
    document.body.style.height = height + 'px';
  }

  function startResize(e, mode) {
    isResizing = true;
    currentResizeMode = mode;
    e.preventDefault();
    document.body.classList.add('select-none');
  }

  // Bind handles
  document.getElementById('resizeHandle').addEventListener('mousedown', (e) => startResize(e, 'both'));
  document.getElementById('resizeBottom').addEventListener('mousedown', (e) => startResize(e, 'bottom'));
  document.getElementById('resizeLeft').addEventListener('mousedown', (e) => startResize(e, 'width'));
  // 'resizeRight' is effectively same as handle but standard drag
  document.getElementById('resizeRight')?.addEventListener('mousedown', (e) => startResize(e, 'width'));

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    // Calculate new dimensions
    // Minimum 400x300, Maximum is technically browser-limited (usually ~800x600 for popups)
    // But we will allow dragging up to screen availability to let the browser enforce the hard limit.
    const maxWidth = screen.availWidth;
    const maxHeight = screen.availHeight;
    const minWidth = 400;
    const minHeight = 300;

    // In Chrome popup, e.clientX is relative to the popup's viewport (0,0 is top-left).
    // Since it's anchored Top-Right, resizing "width" effectively means dragging the left border?
    // Actually standard popup is anchored Right. 
    // So if we drag mouse to the right, clientX increases. Width should increase.
    // BUT if we drag left edge, we want width to increase as x decreases?
    // Chrome extension popups behave like normal windows: width extends to the right. 
    // The "Left Resize" handle on a standard LTR layout is meaningless unless the window moves.
    // BUT users asked for "omni directional".
    // Let's assume standard behavior:
    // Dragging Right Edge/Corner -> Increases Width.
    // Dragging Bottom Edge -> Increases Height.

    if (currentResizeMode === 'both' || currentResizeMode === 'width') {
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      document.body.style.width = newWidth + 'px';
    }

    if (currentResizeMode === 'both' || currentResizeMode === 'bottom') {
      const newHeight = Math.min(Math.max(e.clientY, minHeight), maxHeight);
      document.body.style.height = newHeight + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      currentResizeMode = null;
      document.body.classList.remove('select-none');

      localStorage.setItem('popupSize', JSON.stringify({
        width: parseInt(document.body.style.width),
        height: parseInt(document.body.style.height)
      }));
    }
  });
});
