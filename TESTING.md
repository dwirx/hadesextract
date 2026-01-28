# 🧪 Testing Guide - Text Extractor Pro v3.0.0

## 📋 Pre-Testing Checklist

Before testing, ensure:
- ✅ Chrome/Edge browser (latest version)
- ✅ Extension loaded in Developer Mode
- ✅ All files are in correct directories
- ✅ No console errors on extension load

---

## 🚀 How to Load Extension

1. Open Chrome/Edge
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `hadestext` folder
6. Extension icon should appear in toolbar

---

## ✅ Test Cases

### 1. **Copy to Clipboard** ✨ (FIXED)

**Steps:**
1. Click extension icon
2. Click "Full Page" button
3. Wait for extraction to complete
4. Click "Copy" button

**Expected Result:**
- ✅ Button shows "Copied!" with checkmark
- ✅ Button turns green temporarily
- ✅ Status message: "Copied to clipboard!"
- ✅ Content is in clipboard (test with Ctrl+V)

**Fallback Test:**
- If modern API fails, should use `document.execCommand('copy')`
- Should show error message if both methods fail

---

### 2. **Select Mode** 🎯 (FIXED)

**Steps:**
1. Open any website (NOT chrome:// pages)
2. Click extension icon
3. Click "Select" button
4. Popup should close
5. Hover over page elements

**Expected Result:**
- ✅ Blue highlight appears on hover
- ✅ Tooltip shows element info (tag, chars)
- ✅ Instructions banner at top
- ✅ Click element to extract
- ✅ Notification: "Text extracted!"

**Error Handling:**
- If content script not loaded → Auto-inject and retry
- If chrome:// page → Show error: "Cannot extract from browser pages"
- If tab not accessible → Show error: "Cannot access current tab"

---

### 3. **Image Extraction** 🖼️ (FIXED)

**Steps:**
1. Go to a page with images (e.g., Wikipedia, news site)
2. Enable "Include Images" option
3. Click "Full Page"
4. Check extracted content

**Expected Result:**
- ✅ Images appear in "IMAGES" section (Structured format)
- ✅ Images show as `![alt](url)` in Markdown
- ✅ Images render in HTML export
- ✅ Lazy-loaded images are captured (data-src, data-lazy-src)
- ✅ Alt text is preserved

**Test Sites:**
- Wikipedia article (has many images)
- News website (CNN, BBC)
- Blog with photos

---

### 4. **Full Page Extraction** 📄

**Steps:**
1. Open any article/blog page
2. Click "Full Page" button
3. Check results

**Expected Result:**
- ✅ All visible text extracted
- ✅ Headings preserved with # markers
- ✅ Lists formatted correctly
- ✅ Tables extracted (if enabled)
- ✅ Stats updated (chars, words, sentences, reading time)

---

### 5. **Article Only Mode** 📖

**Steps:**
1. Open a news article or blog post
2. Click "Article Only" button
3. Compare with "Full Page"

**Expected Result:**
- ✅ Only main content extracted
- ✅ Ads removed
- ✅ Navigation removed
- ✅ Sidebars removed
- ✅ Comments removed

**Test Sites:**
- Medium article
- News article (CNN, BBC)
- Blog post

---

### 6. **Format Switching** 🔄

**Steps:**
1. Extract content (any mode)
2. Switch between formats:
   - Structured
   - Markdown
   - HTML
   - JSON
   - Plain

**Expected Result:**
- ✅ Content reformats instantly
- ✅ Format badge updates
- ✅ No data loss between formats
- ✅ Each format has correct syntax

---

### 7. **Download Functionality** 💾

**Steps:**
1. Extract content
2. Click "Download" button
3. Select format (.txt, .md, .html, .json)

**Expected Result:**
- ✅ File downloads with correct extension
- ✅ Filename: `{page-title}-{date}.{ext}`
- ✅ Content matches displayed text
- ✅ HTML file opens in browser correctly
- ✅ JSON is valid (test with JSON validator)

---

### 8. **Options Persistence** ⚙️

**Steps:**
1. Change options (checkboxes)
2. Close popup
3. Reopen popup

**Expected Result:**
- ✅ Options are remembered
- ✅ Format selection persists
- ✅ Textarea height persists

---

### 9. **Settings Page** 🎨

**Steps:**
1. Right-click extension icon → Options
2. OR go to `chrome://extensions/` → Details → Extension options

**Expected Result:**
- ✅ Settings page opens
- ✅ All options visible
- ✅ Theme switcher works
- ✅ Save button works
- ✅ Reset button works
- ✅ Ctrl+S saves settings

---

### 10. **Dark Mode** 🌓

**Steps:**
1. Open Settings page
2. Change theme to "Dark"
3. Check popup and settings page

**Expected Result:**
- ✅ Colors invert correctly
- ✅ Text remains readable
- ✅ No white flashes
- ✅ Theme persists after reload

---

### 11. **Keyboard Shortcuts** ⌨️

**In Popup:**
- `Ctrl+K` or `Cmd+K` → Clear content
- `Ctrl+C` or `Cmd+C` → Copy (when not in textarea)
- `Ctrl+S` or `Cmd+S` → Download
- `Esc` → Close dropdowns

**In Settings:**
- `Ctrl+S` or `Cmd+S` → Save settings

**Expected Result:**
- ✅ All shortcuts work
- ✅ No conflicts with browser shortcuts

---

### 12. **Error Handling** ⚠️

**Test Scenarios:**

**A. Protected Pages**
- Go to `chrome://extensions/`
- Try to extract
- **Expected:** Error message: "Cannot extract from browser pages"

**B. Empty Page**
- Go to `about:blank`
- Try to extract
- **Expected:** Extracts minimal content or shows warning

**C. No Internet**
- Disconnect internet
- Try to extract from cached page
- **Expected:** Should still work (no network needed)

**D. Large Content**
- Extract from very long page (e.g., long Wikipedia article)
- **Expected:** Should handle without freezing

---

## 🐛 Known Issues & Workarounds

### Issue 1: Select Mode Error (FIXED ✅)
**Error:** "Could not establish connection. Receiving end does not exist."

**Fix Applied:**
- Auto-inject content script if not loaded
- Better error messages
- Retry mechanism

**Test:** Should work now on all pages

---

### Issue 2: Copy Not Working (FIXED ✅)
**Problem:** Clipboard API permission issues

**Fix Applied:**
- Fallback to `document.execCommand('copy')`
- Better error handling
- Visual feedback

**Test:** Try copying on different pages

---

### Issue 3: Images Not Showing (FIXED ✅)
**Problem:** Images not extracted properly

**Fix Applied:**
- Support for lazy-loaded images (data-src, data-lazy-src)
- Better alt text handling
- Images in all formats (Markdown, HTML, Structured)

**Test:** Extract from image-heavy pages

---

## 📊 Performance Testing

### Memory Usage
1. Open Task Manager (Shift+Esc in Chrome)
2. Find "Text Extractor Pro"
3. Extract from large page
4. Check memory usage

**Expected:** < 50MB for normal pages

### Speed Testing
1. Start timer
2. Click "Full Page"
3. Stop when results appear

**Expected:** < 2 seconds for normal pages

---

## 🔍 Debugging Tips

### View Console Logs
1. Right-click extension icon → Inspect popup
2. Check Console tab for errors

### Check Background Script
1. Go to `chrome://extensions/`
2. Click "Inspect views: background page"
3. Check Console for errors

### Check Content Script
1. Open any page
2. Press F12 (DevTools)
3. Check Console for content script errors

---

## ✅ Final Checklist

Before releasing:
- [ ] All test cases pass
- [ ] No console errors
- [ ] Copy works on all pages
- [ ] Select mode works
- [ ] Images extract correctly
- [ ] All formats work
- [ ] Download works
- [ ] Settings persist
- [ ] Dark mode works
- [ ] Keyboard shortcuts work
- [ ] Error messages are clear
- [ ] Performance is good

---

## 🎉 Success Criteria

Extension is ready when:
1. ✅ All 12 test cases pass
2. ✅ No critical bugs
3. ✅ Performance is acceptable
4. ✅ User experience is smooth
5. ✅ Error handling is robust

---

## 📝 Bug Report Template

If you find a bug:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Browser:** Chrome/Edge [version]
**Extension Version:** 3.0.0
**Console Errors:** [Paste any errors]
**Screenshot:** [If applicable]
```

---

## 🚀 Next Steps

After all tests pass:
1. Update CHANGELOG.md
2. Create release notes
3. Zip extension for distribution
4. Submit to Chrome Web Store (optional)

---

**Happy Testing! 🎉**
