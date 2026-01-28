/**
 * ============================================
 * Text Extractor Pro - Output Formatters
 * Optimized formatters for different output types
 * ============================================
 */

import { escapeHtml, safeJSONStringify } from './utils.js';
import { OUTPUT_FORMATS } from './constants.js';

/**
 * Base Formatter class
 */
class BaseFormatter {
  constructor(data) {
    this.data = data;
  }
  
  format() {
    throw new Error('format() must be implemented by subclass');
  }
}

/**
 * Structured text formatter
 */
class StructuredFormatter extends BaseFormatter {
  format() {
    const lines = [];
    
    // Header
    lines.push(`📄 ${this.data.title}`);
    lines.push(`🔗 ${this.data.url}`);
    lines.push('═'.repeat(50));
    lines.push('');
    
    // Main content
    lines.push(this.data.text);
    
    // Links section
    if (this.data.links && this.data.links.length > 0) {
      lines.push('');
      lines.push('─'.repeat(50));
      lines.push('🔗 LINKS');
      lines.push('─'.repeat(50));
      this.data.links.forEach((link, i) => {
        lines.push(`${i + 1}. ${link.text}`);
        lines.push(`   ${link.url}`);
      });
    }
    
    // Images section
    if (this.data.images && this.data.images.length > 0) {
      lines.push('');
      lines.push('─'.repeat(50));
      lines.push('🖼️ IMAGES');
      lines.push('─'.repeat(50));
      this.data.images.forEach((img, i) => {
        lines.push(`${i + 1}. ${img.alt || 'No description'}`);
        lines.push(`   ${img.src}`);
      });
    }
    
    return lines.join('\n');
  }
}

/**
 * Markdown formatter
 */
class MarkdownFormatter extends BaseFormatter {
  format() {
    const lines = [];
    
    // Title as H1
    lines.push(`# ${this.data.title}`);
    lines.push('');
    lines.push(`> Source: [${this.data.url}](${this.data.url})`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // Main content
    lines.push(this.data.text);
    
    // Links as reference section
    if (this.data.links && this.data.links.length > 0) {
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push('## References');
      lines.push('');
      this.data.links.forEach(link => {
        lines.push(`- [${link.text}](${link.url})`);
      });
    }
    
    return lines.join('\n');
  }
}

/**
 * HTML formatter
 */
class HTMLFormatter extends BaseFormatter {
  format() {
    const parts = [];
    
    // DOCTYPE and head
    parts.push('<!DOCTYPE html>');
    parts.push('<html lang="en">');
    parts.push('<head>');
    parts.push('  <meta charset="UTF-8">');
    parts.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    parts.push(`  <title>${escapeHtml(this.data.title)}</title>`);
    parts.push(this.getStyles());
    parts.push('</head>');
    parts.push('<body>');
    
    // Header
    parts.push(`  <header>`);
    parts.push(`    <h1>${escapeHtml(this.data.title)}</h1>`);
    parts.push(`    <p class="source">Source: <a href="${this.data.url}">${this.data.url}</a></p>`);
    parts.push(`  </header>`);
    parts.push(`  <hr>`);
    
    // Main content
    parts.push(`  <main>`);
    parts.push(this.convertToHTML(this.data.text));
    parts.push(`  </main>`);
    
    // Footer
    parts.push(`  <footer>`);
    parts.push(`    <p>Extracted on ${new Date(this.data.metadata.extractedAt).toLocaleString()}</p>`);
    parts.push(`  </footer>`);
    
    parts.push('</body>');
    parts.push('</html>');
    
    return parts.join('\n');
  }
  
  getStyles() {
    return `  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
    }
    header {
      margin-bottom: 30px;
    }
    h1 {
      color: #1e293b;
      margin-bottom: 10px;
    }
    .source {
      color: #64748b;
      font-size: 14px;
    }
    .source a {
      color: #6366f1;
      text-decoration: none;
    }
    .source a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 20px 0;
    }
    main {
      margin: 30px 0;
    }
    h2, h3, h4, h5, h6 {
      color: #334155;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    p {
      margin-bottom: 16px;
    }
    blockquote {
      border-left: 3px solid #6366f1;
      padding-left: 15px;
      color: #475569;
      margin: 20px 0;
    }
    pre {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
    }
    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre code {
      background: none;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
    }
    ul, ol {
      margin: 16px 0;
      padding-left: 30px;
    }
    li {
      margin-bottom: 8px;
    }
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
      text-align: center;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
    }
  </style>`;
  }
  
  convertToHTML(text) {
    // Convert markdown-like syntax to HTML
    let html = text;
    
    // Headings
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Lists
    html = html.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
    
    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Code blocks
    html = html.replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return '    ' + html.split('\n').join('\n    ');
  }
}

/**
 * JSON formatter
 */
class JSONFormatter extends BaseFormatter {
  format() {
    const output = {
      meta: {
        title: this.data.title,
        url: this.data.url,
        extractedAt: this.data.metadata.extractedAt,
        mode: this.data.metadata.mode,
        stats: {
          characters: this.data.text.length,
          words: this.data.text.trim().split(/\s+/).length,
          headings: this.data.headings.length,
          paragraphs: this.data.paragraphs.length,
          lists: this.data.lists.length,
          tables: this.data.tables.length,
          links: this.data.links.length,
          images: this.data.images.length
        }
      },
      content: {
        text: this.data.text,
        headings: this.data.headings,
        paragraphs: this.data.paragraphs,
        lists: this.data.lists,
        tables: this.data.tables,
        links: this.data.links,
        images: this.data.images
      }
    };
    
    return safeJSONStringify(output);
  }
}

/**
 * Plain text formatter
 */
class PlainFormatter extends BaseFormatter {
  format() {
    let text = this.data.text;
    
    // Remove markdown syntax
    text = text.replace(/^#+\s*/gm, '');        // Remove heading markers
    text = text.replace(/^[•\-]\s*/gm, '- ');   // Standardize bullets
    text = text.replace(/\*\*(.+?)\*\*/g, '$1'); // Remove bold
    text = text.replace(/\*(.+?)\*/g, '$1');     // Remove italic
    text = text.replace(/`(.+?)`/g, '$1');       // Remove inline code
    text = text.replace(/```[\s\S]*?```/g, '');  // Remove code blocks
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Remove links
    text = text.replace(/\n{3,}/g, '\n\n');      // Clean multiple newlines
    
    return text.trim();
  }
}

/**
 * Formatter factory
 */
export class FormatterFactory {
  static create(format, data) {
    switch (format) {
      case OUTPUT_FORMATS.MARKDOWN:
        return new MarkdownFormatter(data);
      case OUTPUT_FORMATS.HTML:
        return new HTMLFormatter(data);
      case OUTPUT_FORMATS.JSON:
        return new JSONFormatter(data);
      case OUTPUT_FORMATS.PLAIN:
        return new PlainFormatter(data);
      case OUTPUT_FORMATS.STRUCTURED:
      default:
        return new StructuredFormatter(data);
    }
  }
  
  static format(format, data) {
    const formatter = this.create(format, data);
    return formatter.format();
  }
}

/**
 * Quick format function
 * @param {Object} data - Extracted data
 * @param {string} format - Output format
 * @returns {string} Formatted output
 */
export function formatOutput(data, format = OUTPUT_FORMATS.STRUCTURED) {
  return FormatterFactory.format(format, data);
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.FormatterFactory = FormatterFactory;
  window.formatOutput = formatOutput;
}
