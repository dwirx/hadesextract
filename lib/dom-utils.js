/**
 * ============================================
 * Text Extractor Pro - DOM Utilities
 * DOM manipulation and element detection
 * ============================================
 */

/**
 * Checks if element is visible in viewport
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} Is visible
 */
export function isVisible(el) {
  if (!el || !(el instanceof HTMLElement)) return false;
  
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    el.offsetParent !== null
  );
}

/**
 * Checks if element is likely an ad or navigation
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} Is ad or navigation
 */
export function isAdOrNav(el) {
  if (!el || !(el instanceof HTMLElement)) return false;
  
  const adPatterns = /ad[-_]?|ads[-_]?|advert|banner|sidebar|widget|nav|menu|footer|header|comment|social|share|related|popup|modal|cookie|promo|sponsor/i;
  
  const id = el.id || '';
  const className = typeof el.className === 'string' ? el.className : '';
  const role = el.getAttribute('role') || '';
  const ariaLabel = el.getAttribute('aria-label') || '';
  
  // Check patterns
  if (adPatterns.test(id) || adPatterns.test(className) || adPatterns.test(ariaLabel)) {
    return true;
  }
  
  // Check role
  if (['navigation', 'banner', 'contentinfo', 'complementary'].includes(role)) {
    return true;
  }
  
  // Check tag name
  if (['NAV', 'ASIDE', 'FOOTER', 'HEADER'].includes(el.tagName)) {
    return true;
  }
  
  return false;
}

/**
 * Finds main content element on page
 * @returns {HTMLElement} Main content element
 */
export function findMainContent() {
  // Priority selectors for main content
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.content',
    '.post',
    '.article',
    '.story',
    '#content',
    '#main',
    '#article',
    '[itemprop="articleBody"]',
    '.markdown-body', // GitHub
    '.post-body', // Blogger
    '.entry', // WordPress
  ];
  
  // Try each selector
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim().length > 200 && isVisible(el)) {
        return el;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  
  // Fallback: find largest visible text block
  return findLargestTextBlock();
}

/**
 * Finds the largest text block on page
 * @returns {HTMLElement} Largest text block
 */
function findLargestTextBlock() {
  let maxLength = 0;
  let mainEl = document.body;
  
  const candidates = document.querySelectorAll('div, section, article');
  
  candidates.forEach(el => {
    if (isVisible(el) && !isAdOrNav(el)) {
      const text = el.textContent || '';
      const textLength = text.trim().length;
      
      // Check if this element has more text than its parent
      // (to avoid selecting parent when child has the content)
      const parent = el.parentElement;
      const parentText = parent ? parent.textContent.trim().length : 0;
      const ratio = parentText > 0 ? textLength / parentText : 1;
      
      if (textLength > maxLength && ratio > 0.5) {
        maxLength = textLength;
        mainEl = el;
      }
    }
  });
  
  return mainEl;
}

/**
 * Extracts table data as 2D array
 * @param {HTMLTableElement} table - Table element
 * @returns {Array<Array<string>>} Table data
 */
export function extractTableData(table) {
  if (!table || table.tagName !== 'TABLE') return [];
  
  const rows = [];
  
  // Extract all rows (including thead, tbody, tfoot)
  const trs = table.querySelectorAll('tr');
  
  trs.forEach(tr => {
    const cells = [];
    const cellElements = tr.querySelectorAll('th, td');
    
    cellElements.forEach(cell => {
      const text = cell.textContent.trim();
      const colspan = parseInt(cell.getAttribute('colspan')) || 1;
      
      // Handle colspan
      for (let i = 0; i < colspan; i++) {
        cells.push(i === 0 ? text : '');
      }
    });
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  });
  
  return rows;
}

/**
 * Gets element selector path
 * @param {HTMLElement} el - Element
 * @returns {string} Selector path
 */
export function getElementSelector(el) {
  if (!el || !(el instanceof HTMLElement)) return '';
  
  const parts = [];
  let current = el;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      parts.unshift(selector);
      break;
    }
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    parts.unshift(selector);
    current = current.parentElement;
  }
  
  return parts.join(' > ');
}

/**
 * Gets element info for display
 * @param {HTMLElement} el - Element
 * @returns {Object} Element info
 */
export function getElementInfo(el) {
  if (!el || !(el instanceof HTMLElement)) {
    return {
      tagName: 'unknown',
      id: '',
      className: '',
      textLength: 0,
      selector: ''
    };
  }
  
  const tagName = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const className = el.className && typeof el.className === 'string'
    ? '.' + el.className.split(' ').filter(c => c).slice(0, 2).join('.')
    : '';
  const textLength = (el.textContent || '').trim().length;
  const selector = getElementSelector(el);
  
  return {
    tagName,
    id,
    className,
    textLength,
    selector
  };
}

/**
 * Removes all child nodes from element
 * @param {HTMLElement} el - Element to clear
 */
export function clearElement(el) {
  if (!el || !(el instanceof HTMLElement)) return;
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Creates element with attributes
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes
 * @param {string|HTMLElement|Array} children - Children
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = null) {
  const el = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  // Add children
  if (children) {
    if (typeof children === 'string') {
      el.textContent = children;
    } else if (children instanceof HTMLElement) {
      el.appendChild(children);
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
          el.appendChild(child);
        }
      });
    }
  }
  
  return el;
}

/**
 * Waits for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<HTMLElement>} Element
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Checks if element is in viewport
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} Is in viewport
 */
export function isInViewport(el) {
  if (!el || !(el instanceof HTMLElement)) return false;
  
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scrolls element into view smoothly
 * @param {HTMLElement} el - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollToElement(el, options = {}) {
  if (!el || !(el instanceof HTMLElement)) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  };
  
  el.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * Gets all text nodes from element
 * @param {HTMLElement} el - Element
 * @returns {Array<Text>} Text nodes
 */
export function getTextNodes(el) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return node.textContent.trim().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes;
}

/**
 * Highlights text in element
 * @param {HTMLElement} el - Element
 * @param {string} text - Text to highlight
 * @param {string} className - CSS class for highlight
 */
export function highlightText(el, text, className = 'highlight') {
  if (!el || !text) return;
  
  const textNodes = getTextNodes(el);
  const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  textNodes.forEach(node => {
    const parent = node.parentNode;
    const content = node.textContent;
    
    if (regex.test(content)) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      
      content.replace(regex, (match, index) => {
        // Add text before match
        if (index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(content.substring(lastIndex, index))
          );
        }
        
        // Add highlighted match
        const mark = document.createElement('mark');
        mark.className = className;
        mark.textContent = match;
        fragment.appendChild(mark);
        
        lastIndex = index + match.length;
      });
      
      // Add remaining text
      if (lastIndex < content.length) {
        fragment.appendChild(
          document.createTextNode(content.substring(lastIndex))
        );
      }
      
      parent.replaceChild(fragment, node);
    }
  });
}

/**
 * Removes highlights from element
 * @param {HTMLElement} el - Element
 * @param {string} className - CSS class of highlights
 */
export function removeHighlights(el, className = 'highlight') {
  if (!el) return;
  
  const highlights = el.querySelectorAll(`.${className}`);
  highlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}
