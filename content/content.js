import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';

// ============================================
// Text Extractor Pro - Content Script
// Uses Readability and Turndown for premium extraction
// ============================================

let isSelectMode = false;
let hoveredElement = null;

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

function cleanDOM(doc) {
  // 1. Remove rigid noise tags that Readability might miss or that leak content
  const noiseTags = ['script', 'style', 'noscript', 'iframe', 'svg', 'link', 'object', 'embed', 'template', 'form', 'input', 'button'];
  noiseTags.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });

  // 2. Fix Lazy Loaded Images
  // Many sites use data-src and have a transparent spacer as src
  doc.querySelectorAll('img').forEach(img => {
    if (img.dataset.src && (!img.src || img.src.startsWith('data:'))) {
      img.src = img.dataset.src;
    }
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
    }
    // Remove tiny tracking pixels
    if (img.width === 1 && img.height === 1) {
      img.remove();
    }
  });

  // 3. Remove common non-article containers that often pollute blog extraction
  const noisySelectors = [
    'nav',
    'aside',
    'footer',
    '[role="complementary"]',
    '[aria-label*="share" i]',
    '[class*="sidebar" i]',
    '[class*="related" i]',
    '[class*="recommended" i]',
    '[class*="newsletter" i]',
    '[class*="comment" i]'
  ];
  noisySelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });
}

function postProcessText(text) {
  if (!text) return '';
  return text
    // Remove CSS artifacts like :root { ... }
    .replace(/:root\s*\{[\s\S]*?\}/gi, '')
    // Remove @font-face or @media blocks that might leak
    .replace(/@font-face\s*\{[\s\S]*?\}/gi, '')
    .replace(/@media\s*[\s\S]*?\{[\s\S]*?\}/gi, '')
    // Remove common "Read more" links
    .replace(/^Read more.*$/gim, '')
    .replace(/^Share this.*$/gim, '')
    // Fix multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeInlineText(value) {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

function resolveAbsoluteUrl(rawUrl) {
  if (!rawUrl) return '';
  const candidate = rawUrl.trim();
  if (!candidate || candidate.startsWith('data:') || candidate.startsWith('javascript:')) {
    return '';
  }
  try {
    return new URL(candidate, window.location.href).href;
  } catch (_error) {
    return '';
  }
}

function getImageSource(img) {
  return (
    img.getAttribute('src') ||
    img.getAttribute('data-src') ||
    img.getAttribute('data-original') ||
    img.getAttribute('data-lazy-src') ||
    img.getAttribute('data-url') ||
    ''
  );
}

function normalizeAssetUrls(root) {
  root.querySelectorAll('a[href]').forEach(link => {
    const absoluteUrl = resolveAbsoluteUrl(link.getAttribute('href'));
    if (absoluteUrl) {
      link.setAttribute('href', absoluteUrl);
    }
  });

  root.querySelectorAll('img').forEach(img => {
    const absoluteUrl = resolveAbsoluteUrl(getImageSource(img));
    if (absoluteUrl) {
      img.setAttribute('src', absoluteUrl);
    }
  });
}

function collectAssetReferences(root, options = {}) {
  const links = [];
  const images = [];
  const seenLinks = new Set();
  const seenImages = new Set();

  if (options.includeLinks !== false) {
    root.querySelectorAll('a[href]').forEach(link => {
      const url = resolveAbsoluteUrl(link.getAttribute('href'));
      const text = normalizeInlineText(link.textContent);
      if (!url || seenLinks.has(url)) return;
      seenLinks.add(url);
      links.push({
        text: text || url,
        url
      });
    });
  }

  if (options.includeImages !== false) {
    root.querySelectorAll('img').forEach(img => {
      const src = resolveAbsoluteUrl(getImageSource(img));
      if (!src || seenImages.has(src)) return;
      seenImages.add(src);
      const figureCaption = normalizeInlineText(img.closest('figure')?.querySelector('figcaption')?.textContent || '');
      const caption = normalizeInlineText(img.closest('figure')?.querySelector('figcaption')?.textContent || '');
      images.push({
        alt: normalizeInlineText(img.getAttribute('alt')) || figureCaption || 'Image',
        caption,
        src
      });
    });
  }

  return { links, images };
}

function getArticle(docClone) {
  try {
    cleanDOM(docClone); // Clean before parsing
    const reader = new Readability(docClone, {
      charThreshold: 20,
      nbTopCandidates: 5
    });
    return reader.parse();
  } catch (e) {
    console.error("Readability failed", e);
    return null;
  }
}

function getFullPageArticle(docClone) {
  // Try readability first to keep main article quality high on blog/news pages.
  const readable = getArticle(docClone);
  if (readable?.content) return readable;

  // Fallback to semantic content roots before full body.
  const root = docClone.querySelector('main, article, [role="main"]');
  if (root) {
    return {
      title: document.title,
      content: root.innerHTML,
      textContent: root.textContent || '',
      excerpt: ''
    };
  }

  return {
    title: document.title,
    content: document.body.innerHTML,
    textContent: document.body.innerText,
    excerpt: ''
  };
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
  normalizeAssetUrls(tempDiv);

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

  const references = collectAssetReferences(tempDiv, options);
  content = tempDiv.innerHTML;

  const result = {
    title: title,
    url: window.location.href,
    text: '',
    html: content
  };

  if (format === 'markdown' || format === 'obsidian') {
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

    turndownService.addRule('linksToAbsolute', {
      filter: 'a',
      replacement: function (content, node) {
        const href = resolveAbsoluteUrl(node.getAttribute('href'));
        const text = normalizeInlineText(content) || href;
        if (!href) return text;
        return `[${text}](${href})`;
      }
    });

    // Blog-ready image handling: inline markdown with absolute URL.
    turndownService.addRule('images', {
      filter: 'img',
      replacement: function (content, node) {
        const alt = normalizeInlineText(node.getAttribute('alt')) || 'Image';
        const src = resolveAbsoluteUrl(getImageSource(node));
        if (!src) return '';
        return `\n\n![${alt}](${src})\n\n`;
      }
    });

    let mdOutput = '';

    if (format === 'obsidian') {
      const dateStr = new Date().toISOString().split('T')[0];
      mdOutput += `---
title: "${title.replace(/"/g, '\\"')}"
source: "${window.location.href}"
date: ${dateStr}
tags: [read-later, web-clip]
---

> [!info] Data
> **Title**: ${title}
> **Source**: [${window.location.host}](${window.location.href})
> **Clipped**: ${new Date().toLocaleString()}

`;
    } else {
      mdOutput = `# ${title}\n\n`;
      mdOutput += `**Source:** [${window.location.href}](${window.location.href})\n\n`;
      mdOutput += `---\n\n`;
    }

    if (references.images.length > 0 && options.includeImages !== false) {
      const featured = references.images[0];
      mdOutput += `## Featured Image\n\n`;
      mdOutput += `![${featured.alt}](${featured.src})\n\n`;
      if (featured.caption) {
        mdOutput += `_${featured.caption}_\n\n`;
      }
      mdOutput += `---\n\n`;
    }

    if (options.preserveStructure === false) {
      turndownService.addRule('noHeadings', {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        replacement: function (content) {
          return content + '\n\n';
        }
      });
    }

    mdOutput += turndownService.turndown(content);

    if (references.links.length > 0) {
      mdOutput += `\n\n---\n## Link References\n\n`;
      references.links.forEach((link, idx) => {
        mdOutput += `${idx + 1}. [${link.text}](${link.url})\n`;
      });
    }

    if (references.images.length > 0) {
      mdOutput += `\n\n---\n## Image Assets\n\n`;
      references.images.forEach((img, idx) => {
        mdOutput += `${idx + 1}. **${img.alt}**\n`;
        if (img.caption) {
          mdOutput += `   Caption: ${img.caption}\n`;
        }
        mdOutput += `   ${img.src}\n`;
      });
    }

    result.text = postProcessText(mdOutput);

  } else if (format === 'structured') {
    // ... (Keep existing structured logic but add postProcessText)
    let output = '';
    // ... (existing header) ...
    output += `================================================================================\n`;
    output += `TITLE: ${title}\n`;
    output += `SOURCE: ${window.location.href}\n`;
    output += `DATE: ${new Date().toLocaleString()}\n`;
    output += `================================================================================\n\n`;

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '•',
      emDelimiter: ''
    });

    turndownService.addRule('headers', {
      filter: ['h1', 'h2', 'h3'],
      replacement: function (content) {
        return '\n[' + content.toUpperCase() + ']\n' + '-'.repeat(content.length + 2) + '\n\n';
      }
    });

    turndownService.addRule('links', {
      filter: 'a',
      replacement: function (content, node) {
        if (options.includeLinks === false) return content;
        const href = resolveAbsoluteUrl(node.getAttribute('href'));
        const text = normalizeInlineText(content) || href;
        return href ? `${text} (${href})` : text;
      }
    });

    // Keep body clean for structured mode and render assets in appendix.
    turndownService.addRule('images', {
      filter: 'img', 
      replacement: function () {
        return '';
      }
    });

    output += turndownService.turndown(content).trim();

    // Appendices (Links & Images)
    // Links (existing logic)
    if (references.links.length > 0) {
        output += '\n\n\n--------------------------------------------------------------------------------\n';
        output += 'LINKS REFERENCED\n';
        output += '--------------------------------------------------------------------------------\n';
        references.links.forEach((l, i) => {
          output += `[${i + 1}] ${l.text}\n    ${l.url}\n`;
        });
    }

    // Images (from collectedImages)
    if (references.images.length > 0) {
        output += '\n\n--------------------------------------------------------------------------------\n';
        output += 'IMAGE ASSETS\n';
        output += '--------------------------------------------------------------------------------\n';
        references.images.forEach((img, i) => {
          output += `[${i + 1}] ${img.alt}\n`;
          if (img.caption) {
            output += `    Caption: ${img.caption}\n`;
          }
          output += `    ${img.src}\n`;
        });
    }

    result.text = postProcessText(output);

  } else {
    // HTML
    result.text = tempDiv.textContent; // Fallback text
    if (format === 'html') {
      result.text = content; // Raw HTML (already cleaned by DOMPurify)
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
            article = getFullPageArticle(docClone);
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
