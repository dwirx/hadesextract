document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const extractAllBtn = document.getElementById('extractAll');
  const extractArticleBtn = document.getElementById('extractArticle');
  const selectElementBtn = document.getElementById('selectElement');

  const resultSection = document.getElementById('resultSection');
  const resultText = document.getElementById('resultText');
  const resultDisplay = document.getElementById('resultDisplay');

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
  checkCurrentTab();

  chrome.storage.local.get(['lastExtractedData'], (result) => {
    if (result.lastExtractedData) {
      currentData = result.lastExtractedData;
      displayResult(currentData);
      // Clear it so it doesn't persist across sessions if unwanted? 
      // Better to keep it until replaced.
    }
  });

  // Button Listeners
  extractAllBtn.addEventListener('click', () => extract('full'));
  extractArticleBtn.addEventListener('click', () => extract('article', true));
  selectElementBtn.addEventListener('click', toggleSelectMode);

  copyBtn.addEventListener('click', copyToClipboard);
  reformatBtn.addEventListener('click', () => {
    if (currentData) displayResult(currentData);
  });
  clearBtn.addEventListener('click', clearResult);

  // Download handlers
  document.querySelectorAll('[data-format]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const format = e.target.dataset.format;
      downloadResult(format);
    });
  });

  // Options Listeners (Re-extract on format change?)
  // Maybe just reformat if we have data? 
  // If we change format (e.g. MD to HTML), we might need to re-request from content script 
  // because content script does the conversion (Turndown).
  // Yes, format change requires re-extraction or we should ask content script specifically.
  // Actually, better UX: if we have `currentData` (which matches format), and user changes format,
  // we need to ask content script to convert again the same article?
  // Since we don't store the article in Popup, we re-run extract.
  // But that might re-parse the page. 
  // For now, let's keep it simple: User clicks Extract again if they change format.
  // OR: If result is shown, trigger extract again on format change.

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

  async function extract(mode, articleOnly = false) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

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
        displayResult(currentData);
        showStatus('Success!', 'text-emerald-600 bg-emerald-50');
        setTimeout(() => statusEl.classList.add('hidden'), 2000);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);

      // If content script is not loaded, try to inject it
      if (err.message.includes('Receiving end does not exist') ||
        err.message.includes('Could not establish connection')) {

        showStatus('Injecting script...', 'text-indigo-600 bg-indigo-50');

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.bundle.js']
          });

          // Retry extraction
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extract',
            mode: mode,
            articleOnly: articleOnly,
            format: getFormat(),
            options: getOptions()
          });

          if (response && response.success) {
            currentData = response.data;
            displayResult(currentData);
            showStatus('Success!', 'text-emerald-600 bg-emerald-50');
            setTimeout(() => statusEl.classList.add('hidden'), 2000);
            return;
          }
        } catch (injectErr) {
          console.error('Injection failed:', injectErr);
          showStatus('Error: Please refresh the page.', 'text-red-600 bg-red-50');
        }
      } else {
        showStatus('Error: ' + err.message, 'text-red-600 bg-red-50');
      }
    }
  }

  async function toggleSelectMode() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    window.close(); // Close popup to let user select

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

  function copyToClipboard() {
    resultText.select();
    document.execCommand('copy');
    showStatus('Copied to clipboard!', 'text-emerald-600 bg-emerald-50');
    setTimeout(() => statusEl.classList.add('hidden'), 2000);
  }

  function downloadResult(ext) {
    if (!resultText.value) return;

    const blob = new Blob([resultText.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${Date.now()}.${ext}`;
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
