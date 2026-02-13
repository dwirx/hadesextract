import { db } from './utils/index.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const isPopoutMode = params.get('mode') === 'popout';
  if (isPopoutMode) {
    document.documentElement.classList.add('is-popout');
    document.body.classList.add('is-popout');
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.minWidth = '0';
    document.body.style.minHeight = '0';
  }

  // Elements
  const extractAllBtn = document.getElementById('extractAll');
  const extractArticleBtn = document.getElementById('extractArticle');
  const selectElementBtn = document.getElementById('selectElement');

  const resultSection = document.getElementById('resultSection');
  const resultText = document.getElementById('resultText');
  const resultDisplay = document.getElementById('resultDisplay');

  // View Toggle & History
  const viewExtractorBtn = document.getElementById('viewExtractorBtn');
  const viewChatBtn = document.getElementById('viewChatBtn');
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const popoutBtn = document.getElementById('popoutBtn');
  const resetSizeBtn = document.getElementById('resetSizeBtn');
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
  const aiSummarizeBtn = document.getElementById('aiSummarizeBtn');
  const aiExplainBtn = document.getElementById('aiExplainBtn');
  const aiExplainFocus = document.getElementById('aiExplainFocus');
  const resultModeBar = document.getElementById('resultModeBar');
  const showOriginalBtn = document.getElementById('showOriginalBtn');
  const showAiBtn = document.getElementById('showAiBtn');

  // AI Chat View
  const chatSection = document.getElementById('chatSection');
  const chatSessionSelect = document.getElementById('chatSessionSelect');
  const newChatBtn = document.getElementById('newChatBtn');
  const copyChatBtn = document.getElementById('copyChatBtn');
  const deleteChatBtn = document.getElementById('deleteChatBtn');
  const chatContextLabel = document.getElementById('chatContextLabel');
  const chatMessages = document.getElementById('chatMessages');
  const chatThinkingWrap = document.getElementById('chatThinkingWrap');
  const chatProgressFill = document.getElementById('chatProgressFill');
  const chatStatusText = document.getElementById('chatStatusText');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  // Stats
  const charCount = document.getElementById('charCount');
  const wordCount = document.getElementById('wordCount');
  const sentenceCount = document.getElementById('sentenceCount');
  const readingTime = document.getElementById('readingTime');

  let currentData = null;
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const MAX_AI_INPUT_CHARS = 24000;
  const LOCAL_SETTINGS_KEY = 'text_extractor_settings';
  const CHAT_STORAGE_KEY = 'aiChatSessionsV1';
  let currentResultMode = 'original';
  let chatSessions = [];
  let activeChatSessionId = null;

  // Initialize
  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    pageInfo.textContent = tab.title || 'Ready';
    await applySavedSettings();

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
      currentData = {
        ...candidate,
        originalText: candidate.originalText || candidate.text || '',
        aiText: candidate.aiText || ''
      };
      currentResultMode = currentData.aiText ? 'ai' : 'original';
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
    loadChatSessions();
    updateChatContextLabel();
    renderChatSessionsDropdown();
    renderChatMessages();
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
  aiSummarizeBtn.addEventListener('click', () => runAiAction('summarize'));
  aiExplainBtn.addEventListener('click', () => runAiAction('explain'));

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
  viewChatBtn.addEventListener('click', () => switchView('chat'));
  viewHistoryBtn.addEventListener('click', () => switchView('history'));
  openSettingsBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Failed to open options page:', error);
    }
  });
  if (popoutBtn) {
    popoutBtn.addEventListener('click', async () => {
      try {
        const url = chrome.runtime.getURL('popup/popup.html?mode=popout');
        await chrome.tabs.create({ url });
        window.close();
      } catch (error) {
        console.error('Failed to open popout tab:', error);
      }
    });
  }

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Delete all history?')) {
      await db.clear();
      chatSessions = [];
      activeChatSessionId = null;
      writeChatSessions();
      renderChatSessionsDropdown();
      renderChatMessages();
      renderHistory();
    }
  });
  showOriginalBtn.addEventListener('click', () => setResultMode('original'));
  showAiBtn.addEventListener('click', () => setResultMode('ai'));
  newChatBtn.addEventListener('click', () => createChatSession());
  copyChatBtn.addEventListener('click', copyCurrentChatSession);
  deleteChatBtn.addEventListener('click', () => deleteActiveChatSession());
  chatSessionSelect.addEventListener('change', () => {
    activeChatSessionId = chatSessionSelect.value || null;
    renderChatMessages();
    updateChatContextLabel();
  });
  sendChatBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });

  async function switchView(view) {
    const setNavActive = (button, active) => {
      button.classList.toggle('view-nav-btn-active', active);
      button.classList.toggle('text-slate-700', active);
      button.classList.toggle('font-bold', active);
      button.classList.toggle('text-slate-500', !active);
      button.classList.toggle('font-medium', !active);
      button.classList.toggle('bg-white', active);
      button.classList.toggle('shadow-sm', active);
    };

    setNavActive(viewExtractorBtn, view === 'extractor');
    setNavActive(viewChatBtn, view === 'chat');
    setNavActive(viewHistoryBtn, view === 'history');

    if (view === 'extractor') {
      historySection.classList.add('hidden');
      chatSection.classList.add('hidden');
      controlsContainer.classList.remove('hidden');
      if (currentData) resultSection.classList.remove('hidden');
      return;
    }

    if (view === 'chat') {
      controlsContainer.classList.add('hidden');
      resultSection.classList.add('hidden');
      historySection.classList.add('hidden');
      chatSection.classList.remove('hidden');
      updateChatContextLabel();
      renderChatMessages();
      return;
    }

    controlsContainer.classList.add('hidden');
    resultSection.classList.add('hidden');
    chatSection.classList.add('hidden');
    historySection.classList.remove('hidden');
    await renderHistory();
  }

  function readChatSessions() {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to read chat sessions:', error);
      return [];
    }
  }

  function writeChatSessions() {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatSessions));
  }

  function loadChatSessions() {
    chatSessions = readChatSessions();
    if (chatSessions.length && !activeChatSessionId) {
      activeChatSessionId = chatSessions[0].id;
    }
  }

  function getActiveChatSession() {
    if (!activeChatSessionId) return null;
    return chatSessions.find(session => session.id === activeChatSessionId) || null;
  }

  function renderChatSessionsDropdown() {
    chatSessionSelect.innerHTML = '<option value="">New chat session</option>';
    chatSessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = session.title;
      if (session.id === activeChatSessionId) option.selected = true;
      chatSessionSelect.appendChild(option);
    });
  }

  function createChatSession() {
    const baseTitle = currentData?.title || 'Chat Session';
    const item = {
      id: `chat_${Date.now()}`,
      title: `${baseTitle} (${new Date().toLocaleTimeString()})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: {
        title: currentData?.title || '',
        url: currentData?.url || '',
        originalText: currentData?.originalText || currentData?.text || '',
        aiText: currentData?.aiText || ''
      },
      messages: []
    };
    chatSessions.unshift(item);
    activeChatSessionId = item.id;
    writeChatSessions();
    renderChatSessionsDropdown();
    renderChatMessages();
    updateChatContextLabel();
  }

  function deleteActiveChatSession() {
    if (!activeChatSessionId) return;
    const active = getActiveChatSession();
    if (!active) return;
    if (!confirm('Delete this chat session?')) return;
    chatSessions = chatSessions.filter(session => session.id !== active.id);
    activeChatSessionId = chatSessions[0]?.id || null;
    writeChatSessions();
    renderChatSessionsDropdown();
    renderChatMessages();
    updateChatContextLabel();
  }

  function updateChatContextLabel() {
    const hasContext = Boolean(currentData?.originalText || currentData?.text);
    if (hasContext) {
      chatContextLabel.textContent = `Context: ${currentData.title || 'Extracted text'} (${(currentData.originalText || currentData.text || '').length.toLocaleString()} chars)`;
    } else {
      chatContextLabel.textContent = 'Context: no extracted text';
    }
  }

  function renderChatMessages() {
    chatMessages.innerHTML = '';
    const session = getActiveChatSession();
    if (!session || !session.messages.length) {
      chatMessages.innerHTML = '<div class="text-[11px] text-slate-400 p-2">Belum ada chat. Tulis pertanyaan lalu klik Send.</div>';
      return;
    }
    session.messages.forEach(message => {
      const row = document.createElement('div');
      row.className = 'ai-chat-row';

      const role = document.createElement('div');
      role.className = 'ai-chat-role';
      role.textContent = message.role === 'assistant' ? 'AI' : 'You';

      const bubble = document.createElement('div');
      bubble.className = `ai-chat-msg ${message.role}`;
      bubble.textContent = message.content;

      row.appendChild(role);
      if (message.role === 'assistant') {
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy-msg-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => copyText(message.content));
        row.appendChild(copyBtn);
      }
      row.appendChild(bubble);
      chatMessages.appendChild(row);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function startChatThinking(status = 'AI thinking...') {
    let progress = 6;
    if (chatThinkingWrap) chatThinkingWrap.classList.remove('hidden');
    if (chatProgressFill) chatProgressFill.style.width = `${progress}%`;
    if (chatStatusText) chatStatusText.textContent = status;

    const timer = setInterval(() => {
      if (progress >= 92) return;
      progress += Math.floor(Math.random() * 6) + 1;
      if (progress > 92) progress = 92;
      if (chatProgressFill) chatProgressFill.style.width = `${progress}%`;
    }, 220);

    return {
      update(nextStatus) {
        if (chatStatusText && nextStatus) chatStatusText.textContent = nextStatus;
      },
      done(nextStatus = 'Done') {
        clearInterval(timer);
        if (chatProgressFill) chatProgressFill.style.width = '100%';
        if (chatStatusText) chatStatusText.textContent = nextStatus;
        setTimeout(() => {
          if (chatThinkingWrap) chatThinkingWrap.classList.add('hidden');
          if (chatProgressFill) chatProgressFill.style.width = '0%';
        }, 450);
      }
    };
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || '');
      showStatus('Copied.', 'text-emerald-600 bg-emerald-50');
      setTimeout(() => statusEl.classList.add('hidden'), 1200);
    } catch (error) {
      console.error('Copy failed:', error);
      try {
        resultText.value = text || '';
        resultText.select();
        document.execCommand('copy');
        showStatus('Copied (fallback).', 'text-amber-600 bg-amber-50');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        showStatus('Copy failed.', 'text-red-600 bg-red-50');
      }
    }
  }

  function copyCurrentChatSession() {
    const session = getActiveChatSession();
    if (!session || !session.messages?.length) {
      showStatus('No chat to copy.', 'text-amber-600 bg-amber-50');
      return;
    }

    const transcript = [
      `Session: ${session.title}`,
      `Updated: ${session.updatedAt || session.createdAt || '-'}`,
      '',
      ...session.messages.map(msg => `${msg.role === 'assistant' ? 'AI' : 'You'}: ${msg.content}`)
    ].join('\n');

    copyText(transcript);
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
      const itemType = item.type || 'extraction';
      const isChat = itemType === 'chat';
      const previewText = isChat
        ? (item.preview || item.text || item.messages?.[item.messages.length - 1]?.content || '')
        : (item.text || '');

      const el = document.createElement('div');
      el.className = 'group flex flex-col p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer';
      el.innerHTML = `
             <div class="flex items-start justify-between mb-1">
                 <h3 class="font-bold text-xs text-slate-700 line-clamp-1 break-all">${item.title || 'Untitled'}</h3>
                 <span class="text-[9px] text-slate-400 whitespace-nowrap ml-2">${new Date(item.createdAt).toLocaleDateString()}</span>
             </div>
             <p class="text-[10px] text-slate-500 line-clamp-2 mb-2 font-mono bg-slate-50 p-1.5 rounded-md border border-slate-100/50">${previewText.substring(0, 150)}</p>
             <div class="flex items-center justify-between mt-auto">
                 <span class="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">${isChat ? 'CHAT' : (item.format || 'TXT')}</span>
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
        if (isChat) {
          if (item.session) {
            const idx = chatSessions.findIndex(session => session.id === item.session.id);
            if (idx >= 0) {
              chatSessions[idx] = item.session;
            } else {
              chatSessions.unshift(item.session);
            }
            activeChatSessionId = item.session.id;
            writeChatSessions();
            renderChatSessionsDropdown();
          }
          switchView('chat');
          renderChatMessages();
          return;
        }
        currentData = {
          ...item,
          originalText: item.originalText || item.text || '',
          aiText: item.aiText || ''
        };
        setResultMode(currentData.aiText ? 'ai' : 'original');
        displayResult(currentData);
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

  function readSettingsFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.error('Failed to read local settings:', error);
      return {};
    }
  }

  async function getMergedSettings() {
    try {
      const result = await chrome.storage.local.get('settings');
      const localSettings = readSettingsFromLocalStorage();
      return { ...(result.settings || {}), ...localSettings };
    } catch (error) {
      console.error('Failed to read chrome settings:', error);
      return readSettingsFromLocalStorage();
    }
  }

  async function applySavedSettings() {
    try {
      const settings = await getMergedSettings();

      if (typeof settings.preserveStructure === 'boolean') document.getElementById('preserveStructure').checked = settings.preserveStructure;
      if (typeof settings.includeTables === 'boolean') document.getElementById('includeTables').checked = settings.includeTables;
      if (typeof settings.includeLinks === 'boolean') document.getElementById('includeLinks').checked = settings.includeLinks;
      if (typeof settings.includeImages === 'boolean') document.getElementById('includeImages').checked = settings.includeImages;
      if (typeof settings.cleanWhitespace === 'boolean') document.getElementById('cleanWhitespace').checked = settings.cleanWhitespace;
      if (typeof settings.removeAds === 'boolean') document.getElementById('removeAds').checked = settings.removeAds;

      if (settings.defaultFormat) {
        const formatInput = document.querySelector(`input[name="format"][value="${settings.defaultFormat}"]`);
        if (formatInput) formatInput.checked = true;
      }
    } catch (error) {
      console.error('Failed to apply settings in popup:', error);
    }
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
        currentData = {
          ...response.data,
          originalText: response.data.text || '',
          aiText: ''
        };
        currentResultMode = 'original';

        // Save to local storage for persistence across popup reopens
        chrome.storage.local.set({ lastExtractedData: currentData });

        // Auto-save to History
        db.add({
          title: currentData.title,
          text: currentData.originalText,
          originalText: currentData.originalText,
          aiText: '',
          url: currentData.url || '',
          format: getFormat(),
          type: 'extraction'
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
    const originalText = data.originalText || data.text || '';
    const aiText = data.aiText || '';
    const text = currentResultMode === 'ai' && aiText ? aiText : originalText;

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

    if (aiText && originalText) {
      resultModeBar.classList.remove('hidden');
      resultModeBar.classList.add('flex');
      showOriginalBtn.classList.toggle('bg-white', currentResultMode !== 'ai');
      showOriginalBtn.classList.toggle('border-slate-200', currentResultMode !== 'ai');
      showAiBtn.classList.toggle('bg-white', currentResultMode === 'ai');
      showAiBtn.classList.toggle('border-slate-200', currentResultMode === 'ai');
      showAiBtn.classList.toggle('text-slate-700', currentResultMode === 'ai');
      showAiBtn.classList.toggle('text-slate-500', currentResultMode !== 'ai');
    } else {
      resultModeBar.classList.add('hidden');
      resultModeBar.classList.remove('flex');
    }

    resultSection.classList.remove('hidden');
    pageInfo.textContent = data.title || 'Ready';
    updateChatContextLabel();
  }

  function setResultMode(mode) {
    currentResultMode = mode === 'ai' ? 'ai' : 'original';
    if (currentData) {
      displayResult(currentData);
    }
  }

  function clearResult() {
    resultText.value = '';
    resultDisplay.textContent = ''; // Clear display
    resultSection.classList.add('hidden');
    resultModeBar.classList.add('hidden');
    resultModeBar.classList.remove('flex');
    statusEl.classList.add('hidden');
  }

  function showStatus(msg, classes) {
    statusEl.textContent = msg;
    statusEl.className = `p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${classes}`;
    statusEl.classList.remove('hidden');
  }

  function setAiLoading(isLoading) {
    aiSummarizeBtn.disabled = isLoading;
    aiExplainBtn.disabled = isLoading;

    if (isLoading) {
      aiSummarizeBtn.classList.add('opacity-50');
      aiExplainBtn.classList.add('opacity-50');
    } else {
      aiSummarizeBtn.classList.remove('opacity-50');
      aiExplainBtn.classList.remove('opacity-50');
    }
  }

  function truncateInput(text, limit = MAX_AI_INPUT_CHARS) {
    if (!text || text.length <= limit) return text || '';
    return `${text.slice(0, limit)}\n\n[Truncated for AI processing due to length.]`;
  }

  function buildAiMessages(actionType, sourceText, focusText = '') {
    const sharedRules = [
      'Gunakan Bahasa Indonesia yang natural dan jelas.',
      'Jangan menambahkan fakta baru di luar teks sumber.',
      'Jika ada bagian yang tidak disebut di sumber, tulis "Tidak disebutkan dalam teks".',
      'Pertahankan istilah teknis penting agar tidak berubah makna.'
    ];

    if (actionType === 'summarize') {
      return [
        {
          role: 'system',
          content: [
            'Kamu adalah editor ringkasan profesional.',
            ...sharedRules,
            'Prioritaskan inti gagasan, argumen utama, dan kesimpulan.',
            'Output wajib dalam format markdown yang rapi.'
          ].join(' ')
        },
        {
          role: 'user',
          content: [
            'Ringkas teks berikut dengan format:',
            '1) ## Ringkasan Singkat (2-4 kalimat)',
            '2) ## Poin Utama (bullet)',
            '3) ## Kesimpulan (1 paragraf singkat)',
            '',
            `Teks sumber:\n${sourceText}`
          ].join('\n')
        }
      ];
    }

    const focusLine = focusText
      ? `Fokus penjelasan: ${focusText}`
      : 'Fokus penjelasan: jelaskan konsep inti, konteks, dan implikasi praktis.';

    return [
      {
        role: 'system',
        content: [
          'Kamu adalah tutor yang ahli menjelaskan topik kompleks menjadi mudah dipahami.',
          ...sharedRules,
          'Gunakan contoh sederhana bila membantu, tanpa keluar dari konteks teks.',
          'Output wajib dalam format markdown yang rapi.'
        ].join(' ')
      },
      {
        role: 'user',
        content: [
          'Jelaskan isi teks berikut untuk pembaca umum dengan format:',
          '1) ## Inti Pembahasan',
          '2) ## Penjelasan Bertahap (3-6 bullet)',
          '3) ## Istilah Penting (bullet: istilah - arti singkat)',
          '4) ## Hal yang Perlu Diwaspadai / Catatan',
          '',
          focusLine,
          '',
          `Teks sumber:\n${sourceText}`
        ].join('\n')
      }
    ];
  }

  async function callOpenRouter({ apiKey, model, messages }) {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'chrome-extension://text-extractor-pro',
        'X-Title': 'Text Extractor Pro'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `OpenRouter error (${response.status})`;
      throw new Error(message);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No AI response content returned');
    }

    return content.trim();
  }

  async function runAiAction(actionType) {
    if (!currentData || !currentData.text || !currentData.text.trim()) {
      showStatus('Extract text first before using AI.', 'text-amber-600 bg-amber-50');
      return;
    }

    try {
      setAiLoading(true);
      showStatus('Preparing AI request...', 'text-indigo-600 bg-indigo-50');

      const settings = await getMergedSettings();
      const apiKey = (settings.openrouterApiKey || '').trim();
      const model = (settings.openrouterModel || 'openai/gpt-5-nano').trim();

      if (!apiKey) {
        showStatus('Set OpenRouter API key in Options first.', 'text-red-600 bg-red-50');
        return;
      }

      const sourceText = truncateInput(currentData.originalText || currentData.text || '');
      const focusText = (aiExplainFocus?.value || '').trim();
      const messages = buildAiMessages(actionType, sourceText, focusText);

      showStatus('Generating AI response...', 'text-indigo-600 bg-indigo-50');
      const aiText = await callOpenRouter({ apiKey, model, messages });

      currentData = {
        ...currentData,
        originalText: currentData.originalText || currentData.text || '',
        aiText,
        text: aiText
      };
      currentResultMode = 'ai';

      displayResult(currentData);
      await chrome.storage.local.set({ lastExtractedData: currentData });
      await db.add({
        title: `${currentData.title || 'Untitled'} (${actionType === 'summarize' ? 'Ringkasan AI' : 'Penjelasan AI'})`,
        text: currentData.aiText,
        originalText: currentData.originalText,
        aiText: currentData.aiText,
        url: currentData.url || '',
        format: 'plain',
        type: 'extraction'
      });

      showStatus('AI result ready.', 'text-emerald-600 bg-emerald-50');
      setTimeout(() => statusEl.classList.add('hidden'), 2000);
    } catch (error) {
      console.error('AI action failed:', error);
      showStatus(`AI error: ${error.message}`, 'text-red-600 bg-red-50');
    } finally {
      setAiLoading(false);
    }
  }

  async function sendChatMessage() {
    const question = (chatInput.value || '').trim();
    if (!question) return;

    const thinking = startChatThinking('Analyzing context...');
    try {
      sendChatBtn.disabled = true;
      const settings = await getMergedSettings();
      const apiKey = (settings.openrouterApiKey || '').trim();
      const model = (settings.openrouterModel || 'openai/gpt-5-nano').trim();

      if (!apiKey) {
        showStatus('Set OpenRouter API key in Options first.', 'text-red-600 bg-red-50');
        return;
      }

      let session = getActiveChatSession();
      if (!session) {
        createChatSession();
        session = getActiveChatSession();
      }

      const contextText = truncateInput(currentData?.originalText || currentData?.text || '', 14000);
      const contextAi = truncateInput(currentData?.aiText || '', 6000);
      const contextLines = [
        currentData?.title ? `Judul: ${currentData.title}` : '',
        currentData?.url ? `URL: ${currentData.url}` : '',
        contextText ? `Teks original:\n${contextText}` : 'Teks original: tidak tersedia',
        contextAi ? `Hasil AI terakhir:\n${contextAi}` : ''
      ].filter(Boolean).join('\n\n');

      session.messages.push({ role: 'user', content: question, ts: new Date().toISOString() });
      renderChatMessages();
      chatInput.value = '';

      const chatHistory = session.messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const messages = [
        {
          role: 'system',
          content: 'Kamu adalah asisten diskusi teks. Jawab dalam Bahasa Indonesia, ringkas, akurat, dan selalu berbasis konteks yang diberikan.'
        },
        {
          role: 'user',
          content: `Konteks dokumen:\n${contextLines}`
        },
        ...chatHistory
      ];
      thinking.update('Generating answer...');

      const answer = await callOpenRouter({ apiKey, model, messages });
      session.messages.push({ role: 'assistant', content: answer, ts: new Date().toISOString() });
      session.updatedAt = new Date().toISOString();
      session.source = {
        title: currentData?.title || session.source?.title || '',
        url: currentData?.url || session.source?.url || '',
        originalText: currentData?.originalText || currentData?.text || session.source?.originalText || '',
        aiText: currentData?.aiText || session.source?.aiText || ''
      };

      chatSessions = chatSessions
        .filter(item => item.id !== session.id);
      chatSessions.unshift(session);
      activeChatSessionId = session.id;
      writeChatSessions();
      renderChatSessionsDropdown();
      renderChatMessages();
      await db.add({
        title: `${session.source?.title || 'Untitled'} (AI Chat)`,
        type: 'chat',
        preview: answer,
        text: answer,
        messages: session.messages,
        session
      });
      thinking.done('Answer ready');
    } catch (error) {
      console.error('Chat failed:', error);
      showStatus(`AI chat error: ${error.message}`, 'text-red-600 bg-red-50');
      thinking.done('Failed');
    } finally {
      sendChatBtn.disabled = false;
    }
  }

  async function copyToClipboard() {
    if (!resultText.value) return;

    try {
      await navigator.clipboard.writeText(resultText.value);
      showStatus('Copied to clipboard!', 'text-emerald-600 bg-emerald-50');
      setTimeout(() => statusEl.classList.add('hidden'), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback
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
  const POPUP_SIZE_DEFAULT = { width: 860, height: 680 };
  const POPUP_SIZE_MIN = { width: 720, height: 560 };
  const POPUP_SIZE_MAX = { width: 2000, height: 2000 };
  const POPUP_SIZE_KEY = 'popupSize';
  const resizeState = {
    active: false,
    pointerId: null,
    handle: null,
    mode: 'corner',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getMaxSize() {
    return {
      width: Math.min(POPUP_SIZE_MAX.width, Math.max(POPUP_SIZE_MIN.width, screen.availWidth - 24)),
      height: Math.min(POPUP_SIZE_MAX.height, Math.max(POPUP_SIZE_MIN.height, screen.availHeight - 48))
    };
  }

  function applyPopupSize(width, height) {
    const max = getMaxSize();
    const safeWidth = clamp(Math.round(width), POPUP_SIZE_MIN.width, max.width);
    const safeHeight = clamp(Math.round(height), POPUP_SIZE_MIN.height, max.height);

    document.documentElement.style.width = `${safeWidth}px`;
    document.documentElement.style.height = `${safeHeight}px`;
    document.body.style.width = `${safeWidth}px`;
    document.body.style.height = `${safeHeight}px`;
    document.body.style.minWidth = `${POPUP_SIZE_MIN.width}px`;
    document.body.style.minHeight = `${POPUP_SIZE_MIN.height}px`;

    return { width: safeWidth, height: safeHeight };
  }

  function readSavedPopupSize() {
    try {
      const raw = localStorage.getItem(POPUP_SIZE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
        return null;
      }
      return parsed;
    } catch (error) {
      console.error('Invalid popup size in storage:', error);
      return null;
    }
  }

  function persistPopupSize(width, height) {
    localStorage.setItem(POPUP_SIZE_KEY, JSON.stringify({ width, height }));
  }

  function getCurrentPopupSize() {
    const rect = document.body.getBoundingClientRect();
    return {
      width: Math.round(rect.width) || POPUP_SIZE_DEFAULT.width,
      height: Math.round(rect.height) || POPUP_SIZE_DEFAULT.height
    };
  }

  function resetPopupSize() {
    const next = applyPopupSize(POPUP_SIZE_DEFAULT.width, POPUP_SIZE_DEFAULT.height);
    persistPopupSize(next.width, next.height);
    showStatus('Popup size reset.', 'text-emerald-600 bg-emerald-50');
    setTimeout(() => statusEl.classList.add('hidden'), 1600);
  }

  function startResize(event, mode, handle) {
    const current = getCurrentPopupSize();
    if (typeof event.button === 'number' && event.button !== 0) return;

    resizeState.active = true;
    resizeState.pointerId = typeof event.pointerId === 'number' ? event.pointerId : null;
    resizeState.handle = handle || null;
    resizeState.mode = mode;
    resizeState.startX = event.clientX;
    resizeState.startY = event.clientY;
    resizeState.startWidth = current.width;
    resizeState.startHeight = current.height;
    document.body.classList.add('select-none');

    if (resizeState.handle && resizeState.pointerId !== null && resizeState.handle.setPointerCapture) {
      try {
        resizeState.handle.setPointerCapture(resizeState.pointerId);
      } catch (error) {
        // Ignore capture errors and continue with normal pointer tracking.
      }
    }

    event.preventDefault();
  }

  function onResizeMove(event) {
    if (!resizeState.active) return;

    const dx = event.clientX - resizeState.startX;
    const dy = event.clientY - resizeState.startY;

    let width = resizeState.startWidth;
    let height = resizeState.startHeight;

    if (resizeState.mode === 'corner' || resizeState.mode === 'right') {
      width = resizeState.startWidth + dx;
    }

    if (resizeState.mode === 'left') {
      width = resizeState.startWidth - dx;
    }

    if (resizeState.mode === 'corner' || resizeState.mode === 'bottom') {
      height = resizeState.startHeight + dy;
    }

    applyPopupSize(width, height);
  }

  function stopResize() {
    if (!resizeState.active) return;

    if (resizeState.handle && resizeState.pointerId !== null && resizeState.handle.releasePointerCapture) {
      try {
        resizeState.handle.releasePointerCapture(resizeState.pointerId);
      } catch (error) {
        // Ignore release errors.
      }
    }

    resizeState.active = false;
    resizeState.pointerId = null;
    resizeState.handle = null;
    document.body.classList.remove('select-none');
    const current = getCurrentPopupSize();
    persistPopupSize(current.width, current.height);
  }

  if (!isPopoutMode) {
    const initial = readSavedPopupSize() || POPUP_SIZE_DEFAULT;
    const applied = applyPopupSize(initial.width, initial.height);
    persistPopupSize(applied.width, applied.height);
  }

  const resizeHandle = document.getElementById('resizeHandle');
  const resizeBottom = document.getElementById('resizeBottom');
  const resizeLeft = document.getElementById('resizeLeft');
  const resizeRight = document.getElementById('resizeRight');
  if (!isPopoutMode) {
    resizeHandle.style.touchAction = 'none';
    resizeBottom.style.touchAction = 'none';
    resizeLeft.style.touchAction = 'none';
    resizeRight.style.touchAction = 'none';

    resizeHandle.addEventListener('pointerdown', (event) => startResize(event, 'corner', resizeHandle));
    resizeBottom.addEventListener('pointerdown', (event) => startResize(event, 'bottom', resizeBottom));
    resizeLeft.addEventListener('pointerdown', (event) => startResize(event, 'left', resizeLeft));
    resizeRight.addEventListener('pointerdown', (event) => startResize(event, 'right', resizeRight));

    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);

    if (resetSizeBtn) {
      resetSizeBtn.addEventListener('click', resetPopupSize);
    }
  }
});
