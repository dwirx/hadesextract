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

function parseTimestampToSeconds(rawTimestamp) {
  if (!rawTimestamp) return null;
  const parts = rawTimestamp.trim().split(':').map(part => Number(part));
  if (parts.some(Number.isNaN)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60) + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  return null;
}

function formatTimestampForDisplay(totalSeconds, includeHours = false) {
  if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds) || totalSeconds < 0) return '';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (includeHours || hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function extractYouTubeVideoId(pageUrl, root) {
  const candidates = [pageUrl];

  root.querySelectorAll('iframe[src], a[href]').forEach(el => {
    const value = el.getAttribute('src') || el.getAttribute('href');
    if (value) candidates.push(value);
  });

  for (const rawUrl of candidates) {
    const absoluteUrl = resolveAbsoluteUrl(rawUrl);
    if (!absoluteUrl) continue;

    try {
      const parsed = new URL(absoluteUrl);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const v = parsed.searchParams.get('v');
        if (v) return v;

        const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
        if (embedMatch) return embedMatch[1];
      }

      if (host === 'youtu.be') {
        const id = parsed.pathname.split('/').filter(Boolean)[0];
        if (id) return id;
      }
    } catch (_error) {
      // Ignore malformed URL candidates.
    }
  }

  return '';
}

function slugifyAnchorLabel(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'section';
}

function collectTranscriptChapters(root) {
  const chapters = [];
  const seen = new Set();
  const headingNodes = root.querySelectorAll('h1, h2, h3');

  headingNodes.forEach(node => {
    const rawText = normalizeInlineText(node.textContent);
    if (!rawText || seen.has(rawText)) return;
    seen.add(rawText);

    const timestampMatch = rawText.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    const seconds = timestampMatch ? parseTimestampToSeconds(timestampMatch[1]) : null;
    const label = normalizeInlineText(rawText.replace(/(\d{1,2}:\d{2}(?::\d{2})?)/, '').replace(/^[-:|]+/, '')) || rawText;
    const anchor = `chapter${chapters.length}_${slugifyAnchorLabel(label)}`;

    chapters.push({
      rawText,
      label,
      seconds,
      anchor
    });
  });

  return chapters;
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
    const transcriptRoot = document.createElement('div');
    transcriptRoot.innerHTML = content;

    const pageUrl = window.location.href;
    const hostName = window.location.hostname.replace(/^www\./, '');
    const youtubeVideoId = extractYouTubeVideoId(pageUrl, transcriptRoot);
    const chapters = collectTranscriptChapters(transcriptRoot);

    let output = `# Transcript for ${title}\n\n`;
    output += `This is a transcript extracted from ${hostName}. Timestamps are clickable when a YouTube source is available. Please note this transcript is automatically generated and may contain errors.\n\n`;
    output += 'Here are some useful links:\n\n';
    output += `- Go back to [this page](${pageUrl})\n`;
    if (youtubeVideoId) {
      output += `- Watch the [full YouTube version](https://youtube.com/watch?v=${youtubeVideoId})\n`;
    } else if (references.links[0]?.url) {
      output += `- Open a [related source link](${references.links[0].url})\n`;
    }

    if (chapters.length > 0) {
      output += '\n## Table of Contents\n\n';
      output += 'Here are the loose chapters in the conversation:\n\n';

      chapters.forEach(chapter => {
        const label = chapter.label || chapter.rawText;
        let timeLabel = '';
        let chapterLink = `#${chapter.anchor}`;

        if (typeof chapter.seconds === 'number') {
          timeLabel = formatTimestampForDisplay(chapter.seconds);
          if (youtubeVideoId) {
            chapterLink = `https://youtube.com/watch?v=${youtubeVideoId}&t=${chapter.seconds}`;
          }
        }

        const lineLabel = timeLabel ? `${timeLabel} - ${label}` : label;
        output += `- [${lineLabel}](${chapterLink})\n`;
      });
    }

    if (youtubeVideoId) {
      output += `\n<iframe width="700" height="394" src="https://www.youtube.com/embed/${youtubeVideoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="" style="margin: 0px 0px 1.71429rem; padding: 0px; border: 0px; font-size: 16px; vertical-align: baseline; max-width: 100%;"></iframe>\n`;
    }

    const chapterByHeading = new Map();
    chapters.forEach(chapter => {
      chapterByHeading.set(chapter.rawText, chapter);
    });

    const transcriptBlocks = [];
    const contentNodes = transcriptRoot.querySelectorAll('h1, h2, h3, p, li, blockquote');
    contentNodes.forEach(node => {
      const text = normalizeInlineText(node.textContent);
      if (!text) return;

      if (/^H[1-3]$/.test(node.tagName)) {
        const chapter = chapterByHeading.get(text);
        if (chapter) {
          transcriptBlocks.push(`<a id="${chapter.anchor}"></a>`);
          transcriptBlocks.push(`## ${chapter.label || chapter.rawText}`);
          transcriptBlocks.push('');
          return;
        }
        transcriptBlocks.push(`## ${text}`);
        transcriptBlocks.push('');
        return;
      }

      const speakerMatch = text.match(/^([A-Za-z][A-Za-z0-9 .'\-]{1,80}?)\s*[\(\[](\d{1,2}:\d{2}(?::\d{2})?)[\)\]]\s*[:\-–—]?\s*(.+)$/);
      if (speakerMatch) {
        const speaker = normalizeInlineText(speakerMatch[1]);
        const rawTimestamp = speakerMatch[2];
        const body = normalizeInlineText(speakerMatch[3]);
        const seconds = parseTimestampToSeconds(rawTimestamp);
        const timestampDisplay = typeof seconds === 'number'
          ? formatTimestampForDisplay(seconds, true)
          : rawTimestamp;

        if (youtubeVideoId && typeof seconds === 'number') {
          transcriptBlocks.push(`**${speaker}**[(${timestampDisplay})](https://youtube.com/watch?v=${youtubeVideoId}&t=${seconds}) ${body}`);
        } else {
          transcriptBlocks.push(`**${speaker}** (${timestampDisplay}) ${body}`);
        }
      } else {
        transcriptBlocks.push(text);
      }

      transcriptBlocks.push('');
    });

    output += '\n' + transcriptBlocks.join('\n').trim();

    if (references.links.length > 0 && options.includeLinks !== false) {
      output += '\n\n## Referenced Links\n\n';
      references.links.slice(0, 15).forEach(link => {
        output += `- [${link.text}](${link.url})\n`;
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
