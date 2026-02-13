# Changelog

All notable changes to Text Extractor Pro extension will be documented in this file.

## [Unreleased] - 2026-02-13

### ✨ Added - OpenRouter AI Assistant
- Added `AI Assistant (OpenRouter)` settings section in `Options`
- Added `OpenRouter API Key` secure input and `Default Model` setting
- Added OpenRouter `Model Browser` in Options:
  - Sort: `Terbaru` / `Terlama`
  - Filter harga: `Semua`, `Free`, `Harga 0`
  - Select model from live OpenRouter list and apply as default model
- Added popup AI actions:
  - `Ringkas` to summarize extracted content in Indonesian
  - `Jelaskan` to explain extracted content in Indonesian with optional focus topic
- AI outputs now flow into the same result area for reuse with existing copy/download actions

### 🔧 Technical
- Added OpenRouter host permission in `manifest.json` for AI requests
- Popup now reads saved settings (default format + extraction toggles) on load
- Improved Options AI UX:
  - Better visual card layout for API/model setup
  - Softer low-contrast color palette for Settings page
  - API key `Show/Hide` and `Test API` actions
  - Searchable model list with direct `Pilih` action and active-model indicator
  - Settings sync to both `chrome.storage.local` and `localStorage`
  - Popup now supports merged settings fallback from localStorage
  - Popup resize UX improved: larger default size, stronger minimum size, smooth drag resize, and `Reset Size` button

## [2.1.0] - 2026-01-28

### ✨ Added - Responsive & Resizable Interface
- **Responsive Layout**: Popup now adapts to different screen sizes (360px - 800px)
- **Resizable Popup**: Dynamic width and height adjustment
- **Resizable Textarea**: Both horizontal and vertical resize support with visual indicator
- **Auto-height Textarea**: Automatically adjusts to content size (200px - 500px)
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + K`: Clear results
  - `Ctrl/Cmd + C`: Copy to clipboard (when not focused on textarea)
  - `Ctrl/Cmd + S`: Download
  - `Esc`: Close dropdown menus

### 🎨 Enhanced - User Experience
- **Smooth Animations**: Added transitions for all interactive elements
- **Visual Feedback**: Enhanced button press effects and hover states
- **Smart Scrolling**: Auto-scroll to results when extraction completes
- **Improved Dropdowns**: Better animation and timing for download options
- **Loading States**: Visual indicators for extraction operations
- **Copy Confirmation**: Visual feedback when content is copied
- **Textarea Persistence**: Saves and restores textarea size preferences

### 📱 Improved - Responsive Design
- **Mobile-friendly**: Better touch targets for touch devices (min 44px)
- **Adaptive Grids**: Responsive grid layouts for buttons and options
  - Mode buttons: Auto-fit layout
  - Format selector: 1-5 columns based on screen width
  - Options grid: 1-2 columns based on screen width
  - Stats bar: Flexible 2-4 columns
- **Media Queries**: Optimized layouts for:
  - Small screens (< 400px)
  - Medium screens (600px)
  - Large screens (800px)

### 🔧 Technical Improvements
- **Flexbox Layout**: Improved container structure
- **CSS Grid Enhancements**: Auto-fit and minmax for better responsiveness
- **MutationObserver**: Monitors textarea content changes
- **Better Overflow Handling**: Improved scrolling behavior
- **Accessibility**: Enhanced focus states and keyboard navigation
- **Performance**: Debounced resize handlers

### 🎯 UI/UX Polish
- **Resize Indicator**: Visual cue for resizable textarea
- **Section Hover Effects**: Better visual feedback
- **Smooth Transitions**: All state changes are animated
- **Better Spacing**: Improved padding and margins throughout
- **Focus Management**: Better keyboard navigation support

## [2.0.0] - Previous Version
- Initial release with basic features
- Multiple extraction modes (Full Page, Article, Select)
- Multiple output formats (Structured, Markdown, HTML, JSON, Plain)
- Smart content detection
- Statistics tracking
- Export options

---

## Notes

### Responsive Breakpoints
- **Small**: < 400px - Single column layouts, stacked buttons
- **Medium**: 600px - 2-3 column grids
- **Large**: 800px - Full feature layout with 4 columns

### Browser Support
- Chrome 88+
- Edge 88+
- Any Chromium-based browser with Manifest V3 support
