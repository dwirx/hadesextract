document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const extractAllBtn = document.getElementById('extractAll');
  const extractArticleBtn = document.getElementById('extractArticle');
  const selectElementBtn = document.getElementById('selectElement');

  const resultSection = document.getElementById('resultSection');
  const resultText = document.getElementById('resultText');

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
    resultText.value = data.text;
    resultSection.classList.remove('hidden');

    // Stats
    const text = data.text;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;

    charCount.textContent = chars.toLocaleString();
    wordCount.textContent = words.toLocaleString();
    sentenceCount.textContent = sentences.toLocaleString();
    readingTime.textContent = Math.ceil(words / 200) + ' min';
  }

  function clearResult() {
    resultText.value = '';
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
  const resizeHandle = document.getElementById('resizeHandle');
  let isResizing = false;

  // Set initial size if stored
  const savedSize = localStorage.getItem('popupSize');
  if (savedSize) {
    const { width, height } = JSON.parse(savedSize);
    document.body.style.width = width + 'px';
    document.body.style.height = height + 'px';
  }

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault(); // Prevent text selection
    document.body.classList.add('select-none'); // Disable selection during drag
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    // Calculate new dimensions
    // Minimum 400x300, Maximum 800x600 (Chrome limits)
    const newWidth = Math.min(Math.max(e.clientX, 400), 795);
    const newHeight = Math.min(Math.max(e.clientY, 300), 595);

    document.body.style.width = newWidth + 'px';
    document.body.style.height = newHeight + 'px';
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.classList.remove('select-none');

      // Save preference
      localStorage.setItem('popupSize', JSON.stringify({
        width: parseInt(document.body.style.width),
        height: parseInt(document.body.style.height)
      }));
    }
  });
});
