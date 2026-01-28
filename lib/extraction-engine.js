/**
 * ============================================
 * Text Extractor Pro - Extraction Engine
 * Core extraction logic with improved error handling
 * ============================================
 */

import { isVisible, isAdOrNav, findMainContent, extractTableData } from './dom-utils.js';
import { SKIP_TAGS, TEXT_THRESHOLDS } from './constants.js';
import { logError } from './utils.js';

/**
 * Main extraction engine class
 */
export class ExtractionEngine {
  constructor(options = {}) {
    this.options = {
      preserveStructure: true,
      includeTables: true,
      includeLinks: false,
      includeImages: false,
      cleanWhitespace: true,
      removeAds: true,
      articleOnly: false,
      ...options
    };
    
    this.result = this.createEmptyResult();
  }
  
  /**
   * Creates empty result object
   * @returns {Object} Empty result
   */
  createEmptyResult() {
    return {
      title: document.title || '',
      url: window.location.href || '',
      headings: [],
      paragraphs: [],
      lists: [],
      tables: [],
      links: [],
      images: [],
      text: '',
      metadata: {
        extractedAt: new Date().toISOString(),
        mode: this.options.articleOnly ? 'article' : 'full',
        options: { ...this.options }
      }
    };
  }
  
  /**
   * Extracts content from page or element
   * @param {HTMLElement} root - Root element (default: document.body)
   * @returns {Object} Extracted data
   */
  extract(root = null) {
    try {
      // Reset result
      this.result = this.createEmptyResult();
      
      // Determine root element
      const rootElement = root || (this.options.articleOnly ? findMainContent() : document.body);
      
      if (!rootElement) {
        throw new Error('No root element found for extraction');
      }
      
      // Extract content
      this.result.text = this.processElement(rootElement);
      
      // Clean up text if requested
      if (this.options.cleanWhitespace) {
        this.result.text = this.cleanText(this.result.text);
      }
      
      return this.result;
    } catch (error) {
      logError('ExtractionEngine.extract', error, { options: this.options });
      throw error;
    }
  }
  
  /**
   * Processes a single element recursively
   * @param {HTMLElement} el - Element to process
   * @param {number} depth - Current depth
   * @returns {string} Extracted text
   */
  processElement(el, depth = 0) {
    if (!el || !isVisible(el)) return '';
    if (this.options.removeAds && isAdOrNav(el)) return '';
    
    const tagName = el.tagName;
    if (SKIP_TAGS.includes(tagName)) return '';
    
    // Prevent infinite recursion
    if (depth > 50) {
      console.warn('Maximum recursion depth reached');
      return '';
    }
    
    let text = '';
    
    try {
      switch (tagName) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          text = this.processHeading(el);
          break;
          
        case 'P':
          text = this.processParagraph(el);
          break;
          
        case 'UL':
        case 'OL':
          text = this.processList(el);
          break;
          
        case 'TABLE':
          text = this.processTable(el);
          break;
          
        case 'A':
          text = this.processLink(el);
          break;
          
        case 'IMG':
          text = this.processImage(el);
          break;
          
        case 'BR':
          text = '\n';
          break;
          
        case 'HR':
          text = this.options.preserveStructure ? '\n---\n\n' : '\n\n';
          break;
          
        case 'BLOCKQUOTE':
          text = this.processBlockquote(el);
          break;
          
        case 'PRE':
        case 'CODE':
          text = this.processCode(el);
          break;
          
        case 'STRONG':
        case 'B':
          text = this.processStrong(el);
          break;
          
        case 'EM':
        case 'I':
          text = this.processEmphasis(el);
          break;
          
        default:
          // Process children for other elements
          text = this.processChildren(el, depth);
      }
    } catch (error) {
      logError('ExtractionEngine.processElement', error, { tagName, depth });
      // Continue processing other elements
      text = this.processChildren(el, depth);
    }
    
    return text;
  }
  
  /**
   * Processes heading element
   * @param {HTMLElement} el - Heading element
   * @returns {string} Formatted heading
   */
  processHeading(el) {
    const headingText = el.textContent.trim();
    if (!headingText) return '';
    
    const level = parseInt(el.tagName[1]);
    this.result.headings.push({ level, text: headingText });
    
    if (this.options.preserveStructure) {
      return '\n\n' + '#'.repeat(level) + ' ' + headingText + '\n\n';
    }
    return headingText + '\n\n';
  }
  
  /**
   * Processes paragraph element
   * @param {HTMLElement} el - Paragraph element
   * @returns {string} Paragraph text
   */
  processParagraph(el) {
    const pText = el.textContent.trim();
    if (!pText) return '';
    
    this.result.paragraphs.push(pText);
    return pText + '\n\n';
  }
  
  /**
   * Processes list element
   * @param {HTMLElement} el - List element (UL or OL)
   * @returns {string} Formatted list
   */
  processList(el) {
    const listItems = [];
    const isOrdered = el.tagName === 'OL';
    let text = '';
    
    el.querySelectorAll(':scope > li').forEach((li, i) => {
      const liText = li.textContent.trim();
      if (liText) {
        listItems.push(liText);
        if (this.options.preserveStructure) {
          const prefix = isOrdered ? `${i + 1}. ` : '• ';
          text += prefix + liText + '\n';
        } else {
          text += '- ' + liText + '\n';
        }
      }
    });
    
    if (listItems.length > 0) {
      this.result.lists.push({ ordered: isOrdered, items: listItems });
      text += '\n';
    }
    
    return text;
  }
  
  /**
   * Processes table element
   * @param {HTMLElement} el - Table element
   * @returns {string} Formatted table
   */
  processTable(el) {
    if (!this.options.includeTables) return '';
    
    const tableData = extractTableData(el);
    if (tableData.length === 0) return '';
    
    this.result.tables.push(tableData);
    
    let text = '\n';
    
    if (this.options.preserveStructure) {
      // Markdown table format
      tableData.forEach((row, i) => {
        text += '| ' + row.join(' | ') + ' |\n';
        if (i === 0) {
          text += '| ' + row.map(() => '---').join(' | ') + ' |\n';
        }
      });
    } else {
      // Simple tab-separated format
      tableData.forEach(row => {
        text += row.join('\t') + '\n';
      });
    }
    
    text += '\n';
    return text;
  }
  
  /**
   * Processes link element
   * @param {HTMLElement} el - Link element
   * @returns {string} Link text
   */
  processLink(el) {
    const linkText = el.textContent.trim();
    const href = el.href;
    
    if (this.options.includeLinks && href && !href.startsWith('javascript:')) {
      this.result.links.push({ text: linkText, url: href });
    }
    
    return linkText;
  }
  
  /**
   * Processes image element
   * @param {HTMLElement} el - Image element
   * @returns {string} Image description
   */
  processImage(el) {
    if (!this.options.includeImages) return '';
    
    const alt = el.alt || el.title || '';
    const src = el.src;
    
    if (alt || src) {
      this.result.images.push({ alt, src });
      if (alt) return `[Image: ${alt}] `;
    }
    
    return '';
  }
  
  /**
   * Processes blockquote element
   * @param {HTMLElement} el - Blockquote element
   * @returns {string} Formatted quote
   */
  processBlockquote(el) {
    const quoteText = el.textContent.trim();
    if (!quoteText) return '';
    
    if (this.options.preserveStructure) {
      return '\n> ' + quoteText.split('\n').map(l => l.trim()).filter(l => l).join('\n> ') + '\n\n';
    }
    return '"' + quoteText + '"\n\n';
  }
  
  /**
   * Processes code element
   * @param {HTMLElement} el - Code element
   * @returns {string} Formatted code
   */
  processCode(el) {
    const codeText = el.textContent;
    if (!codeText.trim()) return '';
    
    if (this.options.preserveStructure) {
      return '\n```\n' + codeText + '\n```\n\n';
    }
    return codeText + '\n\n';
  }
  
  /**
   * Processes strong/bold element
   * @param {HTMLElement} el - Strong element
   * @returns {string} Formatted text
   */
  processStrong(el) {
    const text = el.textContent.trim();
    if (!text) return '';
    
    if (this.options.preserveStructure) {
      return '**' + text + '**';
    }
    return text;
  }
  
  /**
   * Processes emphasis/italic element
   * @param {HTMLElement} el - Emphasis element
   * @returns {string} Formatted text
   */
  processEmphasis(el) {
    const text = el.textContent.trim();
    if (!text) return '';
    
    if (this.options.preserveStructure) {
      return '*' + text + '*';
    }
    return text;
  }
  
  /**
   * Processes child nodes
   * @param {HTMLElement} el - Parent element
   * @param {number} depth - Current depth
   * @returns {string} Combined text from children
   */
  processChildren(el, depth) {
    let text = '';
    
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const nodeText = child.textContent;
        if (nodeText.trim()) {
          text += nodeText;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        text += this.processElement(child, depth + 1);
      }
    }
    
    return text;
  }
  
  /**
   * Cleans extracted text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/[ \t]+/g, ' ')           // Multiple spaces to single space
      .replace(/\n{3,}/g, '\n\n')        // Multiple newlines to double newline
      .replace(/^\s+|\s+$/gm, '')        // Trim lines
      .trim();                            // Trim overall
  }
}

/**
 * Quick extraction function (convenience wrapper)
 * @param {Object} options - Extraction options
 * @param {HTMLElement} root - Root element
 * @returns {Object} Extracted data
 */
export function extractContent(options = {}, root = null) {
  const engine = new ExtractionEngine(options);
  return engine.extract(root);
}

/**
 * Extracts only selected text
 * @param {string} selectedText - Selected text
 * @returns {Object} Extracted data
 */
export function extractSelection(selectedText) {
  return {
    title: document.title || '',
    url: window.location.href || '',
    headings: [],
    paragraphs: [selectedText],
    lists: [],
    tables: [],
    links: [],
    images: [],
    text: selectedText,
    metadata: {
      extractedAt: new Date().toISOString(),
      mode: 'selection',
      options: {}
    }
  };
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.ExtractionEngine = ExtractionEngine;
  window.extractContent = extractContent;
  window.extractSelection = extractSelection;
}
