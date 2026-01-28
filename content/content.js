import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';

// ============================================
// Text Extractor Pro - Content Script
// Uses Readability and Turndown for premium extraction
// ============================================

let isSelectMode = false;
let hoveredElement = null;
let options = {};

// ============================================
// UI Utilities
// ============================================

function createOverlay() {
  const existing = document.getElementById('text-extractor-overlay');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'text-extractor-overlay';
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    border: 2px solid #6366f1;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 4px;
    transition: all 0.1s ease;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function removeOverlay() {
  document.getElementById('text-extractor-overlay')?.remove();
}

function highlightElement(element) {
  if (!element || element === document.body) return;
  const overlay = createOverlay();
  const rect = element.getBoundingClientRect();
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

// ============================================
// Extraction Logic
// ============================================

function getArticle(docClone) {
  try {
    const reader = new Readability(docClone);
    return reader.parse();
  } catch (e) {
    console.error("Readability failed", e);
    return null;
  }
}

function convertToFormat(article, format, options = {}) {
  if (!article) return { title: document.title, content: '' };

  let content = article.content; // HTML
  const title = article.title;

  // Clean using DOMPurify
  content = DOMPurify.sanitize(content);

  // Custom filtering based on options
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  if (options.includeTables === false) {
    tempDiv.querySelectorAll('table').forEach(el => el.remove());
  }
  if (options.includeImages === false) {
    tempDiv.querySelectorAll('img').forEach(el => el.remove());
  }
  if (options.includeLinks === false) {
    // Replace links with text
    tempDiv.querySelectorAll('a').forEach(el => {
      const span = document.createElement('span');
      span.textContent = el.textContent;
      el.replaceWith(span);
    });
  }

  content = tempDiv.innerHTML;

  const result = {
    title: title,
    url: window.location.href,
    text: '',
    html: content
  };

  if (format === 'markdown') {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      hr: '---'
    });

    // Remove empty links
    turndownService.addRule('removeEmptyLinks', {
      filter: function (node) {
        return node.nodeName === 'A' && !node.getAttribute('href');
      },
      replacement: function (content) {
        return content;
      }
    });

    // Add cleaner title header
    let mdOutput = `# ${title}\n\n`;
    mdOutput += `**Source:** [${window.location.href}](${window.location.href})\n\n`;
    mdOutput += `---\n\n`;

    if (options.preserveStructure === false) {
      turndownService.addRule('noHeadings', {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        replacement: function (content) {
          return content + '\n\n';
        }
      });
    }

    mdOutput += turndownService.turndown(content);

    // Append stats or footer if logical? No, keep it clean.
    result.text = mdOutput;

  } else if (format === 'structured') {
    // Clean Professional Structured Format
    let output = '';

    // 1. Header Section
    output += `================================================================================\n`;
    output += `TITLE: ${title}\n`;
    output += `SOURCE: ${window.location.href}\n`;
    output += `DATE: ${new Date().toLocaleString()}\n`;
    output += `================================================================================\n\n`;

    // 2. Content Section
    // Use Turndown but configured for "Structured Text" (minimal markdown)
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '•',
      emDelimiter: '' // Remove italics markers
    });

    // Simplify headers for structured view
    turndownService.addRule('headers', {
      filter: ['h1', 'h2', 'h3'],
      replacement: function (content) {
        return '\n[' + content.toUpperCase() + ']\n' + '-'.repeat(content.length + 2) + '\n\n';
      }
    });

    // Remove links in text for structured view (keep text only)
    // We will list them at the bottom
    if (options.includeLinks) {
      turndownService.addRule('links', {
        filter: 'a',
        replacement: function (content, node) {
          return content; // Just return text, no []() syntax
        }
      });
    }

    // Remove image syntax in text (images listed below)
    turndownService.addRule('images', {
      filter: 'img',
      replacement: function () { return ''; }
    });

    output += turndownService.turndown(content).trim();

    // 3. Appendices (Links & Images)

    // Links
    if (options.includeLinks) {
      const links = [];
      tempDiv.querySelectorAll('a').forEach(a => {
        if (a.href && !a.href.startsWith('javascript') && a.textContent.trim()) {
          links.push({ text: a.textContent.trim(), url: a.href });
        }
      });

      if (links.length > 0) {
        output += '\n\n\n--------------------------------------------------------------------------------\n';
        output += 'LINKS REFERENCED\n';
        output += '--------------------------------------------------------------------------------\n';
        links.forEach((l, i) => {
          output += `[${i + 1}] ${l.text}\n    ${l.url}\n`;
        });
      }
    }

    // Images
    if (options.includeImages) {
      const images = [];
      tempDiv.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset.src;
        if (src) images.push({ alt: img.alt, src: src });
      });

      if (images.length > 0) {
        output += '\n\n--------------------------------------------------------------------------------\n';
        output += 'IMAGES\n';
        output += '--------------------------------------------------------------------------------\n';
        images.forEach((img, i) => {
          output += `[${i + 1}] ${img.alt || 'Image'}\n    ${img.src}\n`;
        });
      }
    }

    result.text = output;

  } else {
    // HTML
    result.text = tempDiv.textContent;
    if (format === 'html') {
      result.text = content;
    }
  }

  return result;
}

// ============================================
// Event Handlers
// ============================================

function handleMouseMove(e) {
  if (!isSelectMode) return;
  const target = e.target;
  if (target.id?.startsWith('text-extractor')) return;

  if (target !== hoveredElement) {
    hoveredElement = target;
    highlightElement(target);
  }
}

function handleClick(e) {
  if (!isSelectMode) return;
  e.preventDefault();
  e.stopPropagation();

  const element = hoveredElement || e.target;

  // Clone the element for processing to avoid mutating DOM
  const clone = element.cloneNode(true);
  // Wrap in a div to simulate a document for Readability if needed, 
  // but Readability expects a document. 
  // Actually, Readability works best on the whole document.
  // For 'Select', we might just want to use Turndown on the innerHTML.

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(element.innerHTML); // Simple conversion

  // Send back
  chrome.runtime.sendMessage({
    action: 'selectedText',
    data: {
      title: document.title,
      url: window.location.href,
      text: markdown, // Default to MD for selection, or we can handle format in popup
      html: element.innerHTML
    }
  });

  disableSelectMode();
}

function disableSelectMode() {
  isSelectMode = false;
  hoveredElement = null;
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  removeOverlay();
  document.body.classList.remove('text-extractor-selecting');
}

// ============================================
// Message Listener
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'alive' });
    return true;
  }

  if (request.action === 'extract') {
    (async () => {
      try {
        const docClone = document.cloneNode(true);
        let article;

        if (request.articleOnly) {
          // Article Mode: Strict Readability
          // We can pass options to Readability if needed to be stricter
          article = getArticle(docClone);
        } else {
          // Full Page Mode:
          // If users want "Full Page", they usually want the visual content but cleaned up.
          // Turndown directly on body can be messy.
          // Let's stick to Readability but with a custom "cleaning" pass if Readability fails?
          // Actually, Readability is best for "Main Content". 
          // If user wants EVERYTHING, we should just use body.innerHTML but run it through DOMPurify + Turndown.

          if (request.mode === 'full') {
            // For full page, we define "article" as the whole body wrapper
            article = {
              title: document.title,
              content: document.body.innerHTML,
              textContent: document.body.innerText,
              excerpt: ''
            };
          } else {
            article = getArticle(docClone);
          }
        }

        // If Readability fails or returns null (empty page), fallback to body
        if (!article) {
          article = {
            title: document.title,
            content: document.body.innerHTML,
            textContent: document.body.innerText
          };
        }

        const formatted = convertToFormat(article, request.format, request.options);
        sendResponse({ success: true, data: formatted });

      } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open
  }

  if (request.action === 'enableSelectMode') {
    isSelectMode = true;
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.body.classList.add('text-extractor-selecting');
    sendResponse({ success: true });
  }

  if (request.action === 'disableSelectMode') {
    disableSelectMode();
    sendResponse({ success: true });
  }
});
