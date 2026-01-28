// ============================================
// Text Extractor Pro - Background Service Worker
// Handles context menus and message passing
// ============================================

// Store last extracted data
let lastExtractedData = null;

// ============================================
// Context Menu Setup
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'extractSelection',
    title: '📋 Extract Selected Text',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'extractPage',
    title: '📄 Extract Full Page',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'extractElement',
    title: '🎯 Select Element to Extract',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'separator1',
    type: 'separator',
    contexts: ['page', 'selection']
  });
  
  chrome.contextMenus.create({
    id: 'copyAsMarkdown',
    title: '📝 Copy as Markdown',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'copyAsPlain',
    title: '📃 Copy as Plain Text',
    contexts: ['selection']
  });
});

// ============================================
// Context Menu Handlers
// ============================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'extractSelection':
      await handleExtractSelection(info, tab);
      break;
      
    case 'extractPage':
      await handleExtractPage(tab);
      break;
      
    case 'extractElement':
      await handleSelectElement(tab);
      break;
      
    case 'copyAsMarkdown':
      await handleCopyAsMarkdown(info, tab);
      break;
      
    case 'copyAsPlain':
      await handleCopyAsPlain(info, tab);
      break;
  }
});

async function handleExtractSelection(info, tab) {
  const selectedText = info.selectionText;
  if (!selectedText) return;
  
  // Store the selection
  lastExtractedData = {
    title: tab.title,
    url: tab.url,
    text: selectedText,
    headings: [],
    paragraphs: [selectedText],
    lists: [],
    tables: [],
    links: [],
    images: []
  };
  
  chrome.storage.local.set({ lastExtractedData });
  
  // Copy to clipboard and show notification
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      navigator.clipboard.writeText(text).then(() => {
        showExtractorNotification(`Copied ${text.length.toLocaleString()} characters!`, 'success');
      });
      
      function showExtractorNotification(message, type) {
        const existing = document.getElementById('text-extractor-notification');
        if (existing) existing.remove();
        
        const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1' };
        const notification = document.createElement('div');
        notification.id = 'text-extractor-notification';
        notification.innerHTML = `
          <div style="
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            z-index: 2147483647;
            animation: textExtractorSlideIn 0.3s ease;
          ">
            ✓ ${message}
          </div>
          <style>
            @keyframes textExtractorSlideIn {
              from { opacity: 0; transform: translateX(100%); }
              to { opacity: 1; transform: translateX(0); }
            }
          </style>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    },
    args: [selectedText]
  });
}

async function handleExtractPage(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent
    });
    
    if (results && results[0] && results[0].result) {
      lastExtractedData = results[0].result;
      chrome.storage.local.set({ lastExtractedData });
      
      // Show notification
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (chars) => {
          const notification = document.createElement('div');
          notification.id = 'text-extractor-notification';
          notification.innerHTML = `
            <div style="
              position: fixed;
              bottom: 24px;
              right: 24px;
              background: #10b981;
              color: white;
              padding: 16px 24px;
              border-radius: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 14px;
              font-weight: 500;
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
              z-index: 2147483647;
            ">
              ✓ Page extracted! (${chars.toLocaleString()} chars) - Open extension to view
            </div>
          `;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        },
        args: [results[0].result.text.length]
      });
    }
  } catch (error) {
    console.error('Extract page error:', error);
  }
}

async function handleSelectElement(tab) {
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'enableSelectMode',
      options: {
        preserveStructure: true,
        includeTables: true,
        includeLinks: false,
        includeImages: false,
        cleanWhitespace: true,
        removeAds: true
      }
    });
  } catch (error) {
    console.error('Select element error:', error);
  }
}

async function handleCopyAsMarkdown(info, tab) {
  const text = info.selectionText;
  if (!text) return;
  
  // Simple markdown formatting
  const markdown = text
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n\n');
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      navigator.clipboard.writeText(text);
    },
    args: [markdown]
  });
}

async function handleCopyAsPlain(info, tab) {
  const text = info.selectionText;
  if (!text) return;
  
  const plain = text.replace(/\s+/g, ' ').trim();
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      navigator.clipboard.writeText(text);
    },
    args: [plain]
  });
}

// ============================================
// Page Content Extraction Function
// ============================================

function extractPageContent() {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }
  
  function isAdOrNav(el) {
    if (!el) return false;
    const pattern = /ad[-_]?|ads[-_]?|advert|banner|sidebar|widget|nav|menu|footer|header|comment|social|share|related/i;
    const id = el.id || '';
    const className = typeof el.className === 'string' ? el.className : '';
    return pattern.test(id) || pattern.test(className) || 
           ['NAV', 'ASIDE', 'FOOTER', 'HEADER'].includes(el.tagName);
  }
  
  const result = {
    title: document.title,
    url: window.location.href,
    headings: [],
    paragraphs: [],
    lists: [],
    tables: [],
    links: [],
    images: [],
    text: ''
  };
  
  const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'CANVAS'];
  
  function process(el) {
    if (!el || !isVisible(el)) return '';
    if (isAdOrNav(el)) return '';
    if (skipTags.includes(el.tagName)) return '';
    
    let text = '';
    
    switch (el.tagName) {
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
        const h = el.textContent.trim();
        if (h) {
          result.headings.push({ level: parseInt(el.tagName[1]), text: h });
          text = '\n\n' + '#'.repeat(parseInt(el.tagName[1])) + ' ' + h + '\n\n';
        }
        break;
      case 'P':
        const p = el.textContent.trim();
        if (p) {
          result.paragraphs.push(p);
          text = p + '\n\n';
        }
        break;
      case 'UL': case 'OL':
        const items = [];
        el.querySelectorAll(':scope > li').forEach((li, i) => {
          const t = li.textContent.trim();
          if (t) {
            items.push(t);
            text += (el.tagName === 'OL' ? `${i+1}. ` : '• ') + t + '\n';
          }
        });
        if (items.length) result.lists.push({ ordered: el.tagName === 'OL', items });
        text += '\n';
        return text;
      case 'A':
        const href = el.href;
        const lt = el.textContent.trim();
        if (href && lt && !href.startsWith('javascript:')) {
          result.links.push({ text: lt, url: href });
        }
        text = lt;
        break;
      default:
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            const t = child.textContent.trim();
            if (t) text += t + ' ';
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            text += process(child);
          }
        }
    }
    return text;
  }
  
  result.text = process(document.body)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return result;
}

// ============================================
// Message Handlers
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'selectedText':
      lastExtractedData = message.data;
      chrome.storage.local.set({ lastExtractedData });
      // Forward to popup if open
      chrome.runtime.sendMessage(message).catch(() => {});
      sendResponse({ success: true });
      break;
      
    case 'getLastExtracted':
      sendResponse({ data: lastExtractedData });
      break;
  }
  return true;
});
