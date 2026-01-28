# 📄 Text Extractor Pro

A powerful Chrome extension to extract and format text from any website with smart content detection.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ Features

### Extraction Modes
- **🌐 Full Page** - Extract all visible text from the entire page
- **📖 Article Only** - Smart detection to extract main content only (removes ads, navigation, sidebars)
- **🎯 Select Element** - Click on any element to extract only its content

### Output Formats
| Format | Description |
|--------|-------------|
| **Structured** | Clean formatted text with headings, lists, and visual separators |
| **Markdown** | Ready-to-use Markdown format perfect for documentation |
| **HTML** | Complete HTML document with styling |
| **JSON** | Structured data format with metadata and statistics |
| **Plain** | Simple plain text without any formatting |

### Smart Features
- ✅ **Structure Preservation** - Keeps headings (H1-H6), lists, blockquotes intact
- ✅ **Table Extraction** - Extracts tables in clean formatted layout
- ✅ **Link Collection** - Optionally includes all link URLs
- ✅ **Image Descriptions** - Extracts alt text from images
- ✅ **Ad/Nav Removal** - Intelligently removes ads, navigation, footers
- ✅ **Whitespace Cleaning** - Removes extra spaces and blank lines
- ✅ **Responsive Layout** - Popup adapts to different screen sizes
- ✅ **Resizable Textarea** - Drag to resize the output area (both horizontal and vertical)
- ✅ **Auto-height Adjustment** - Textarea automatically adjusts to content
- ✅ **Keyboard Shortcuts** - Quick access with keyboard commands
  - `Ctrl/Cmd + K` - Clear results
  - `Ctrl/Cmd + C` - Copy (when not focused on textarea)
  - `Ctrl/Cmd + S` - Download
  - `Esc` - Close dropdown menus

### Statistics
- Character count
- Word count  
- Sentence count
- Estimated reading time

### Export Options
- 📋 **Copy** - One-click copy to clipboard
- 💾 **Download** - Save as .txt, .md, .html, or .json

## 🚀 Installation

### Load as Unpacked Extension (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `extracttextapp` folder
6. The extension icon will appear in your toolbar

### Build for Production

```bash
# Zip the extension folder
cd extracttextapp
zip -r ../text-extractor-pro.zip .
```

Then upload to Chrome Web Store Developer Dashboard.

## 📖 Usage

### Using the Popup
1. Click the extension icon in your toolbar
2. Choose extraction mode:
   - **Full Page** - Gets everything
   - **Article Only** - Smart extraction
   - **Select** - Manual element picking
3. Select your preferred output format
4. Configure options (structure, tables, links, etc.)
5. Copy or download the extracted content

### Using Context Menu (Right-click)
- **📋 Extract Selected Text** - Extracts highlighted text
- **📄 Extract Full Page** - Extracts entire page
- **🎯 Select Element to Extract** - Enables selection mode
- **📝 Copy as Markdown** - Quick markdown copy
- **📃 Copy as Plain Text** - Quick plain text copy

### Keyboard Shortcuts
- Press **ESC** to cancel element selection mode

## 📁 Project Structure

```
extracttextapp/
├── manifest.json              # Extension configuration (MV3)
├── popup/
│   ├── popup.html             # Popup UI
│   ├── popup.css              # Styles
│   └── popup.js               # Logic & formatting
├── content/
│   ├── content.js             # Page interaction & extraction
│   └── content.css            # Selection overlay styles
├── background/
│   └── service-worker.js      # Background tasks & context menu
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🔐 Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab content |
| `scripting` | Execute extraction scripts |
| `clipboardWrite` | Copy text to clipboard |
| `contextMenus` | Right-click menu integration |
| `storage` | Save user preferences |

## 🎨 Screenshots

### Main Interface
- Clean, modern UI with gradient accents
- Format selector cards
- Real-time statistics

### Element Selection
- Visual highlight overlay
- Element info tooltip
- Smooth animations

## 🛠️ Development

### Tech Stack
- Vanilla JavaScript (ES6+)
- CSS3 with CSS Variables
- Chrome Extension Manifest V3

### Key Files
- `popup/popup.js` - Main extraction logic and formatters
- `content/content.js` - DOM traversal and selection
- `background/service-worker.js` - Context menus and message handling

## 📝 Changelog

### v2.0.0
- ✨ Added multiple output formats (Markdown, HTML, JSON, Plain)
- ✨ Added smart article detection
- ✨ Added table extraction support
- ✨ Added statistics (words, sentences, reading time)
- ✨ Added download in multiple formats
- 🎨 Complete UI redesign
- ⚡ Improved extraction algorithm
- 🐛 Better ad/navigation detection

### v1.0.0
- Initial release
- Basic text extraction
- Element selection mode
- Copy to clipboard

## 📄 License

MIT License - feel free to use and modify!

---

Made with ❤️ for better web content extraction
