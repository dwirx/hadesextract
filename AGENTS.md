# Repository Guidelines

## Project Structure & Module Organization
- `manifest.json` defines the MV3 extension, permissions, and entry points.
- `popup/` holds the user-facing UI (`popup.html`, `popup.css`, `popup.js`).
- `content/` contains the page extraction script and its overlay styles.
- `background/` hosts the service worker for context menus and messaging.
- `options/` implements the settings page UI and logic.
- `lib/` provides shared utilities (formatters, storage, DOM helpers).
- `icons/` contains SVG/PNG assets and icon generation helpers.
- Docs live in `README.md`, `TESTING.md`, and `CHANGELOG.md`.

## Build, Test, and Development Commands
There is no build system; development is done by loading the extension directly.
- Load unpacked: open `chrome://extensions/`, enable Developer Mode, choose “Load unpacked,” and select this repo root.
- Package for release (from repo root):
```bash
zip -r ../text-extractor-pro.zip .
```
This creates a zip you can upload to the Chrome Web Store.

## Coding Style & Naming Conventions
- Indentation: 2 spaces in JS/CSS; keep existing spacing and semicolons.
- Strings: prefer single quotes in JS unless template literals are needed.
- JS style: prefer `const`/`let`, small pure helpers in `lib/`, and descriptive function names.
- Filenames: lowercase with hyphens (e.g., `service-worker.js`); CSS classes use kebab-case (e.g., `section-title`).
- Keep DOM IDs stable; the popup JS relies on specific IDs in `popup/popup.html`.

## Testing Guidelines
- Automated tests are not configured; use the manual checklist in `TESTING.md`.
- Smoke test the main flows: full-page extraction, select mode, copy/download, and options persistence.
- For debugging, inspect the popup and background service worker consoles via `chrome://extensions/`.

## Commit & Pull Request Guidelines
- This workspace doesn’t include git history; use concise, imperative commit messages (e.g., “Fix copy feedback”).
- PRs should include a clear summary, testing notes, and screenshots/GIFs for UI changes.
- Update `CHANGELOG.md` for user-visible changes, and ensure `manifest.json` version matches releases.

## Configuration & Security Tips
- Keep permissions minimal and justified in `manifest.json`.
- Validate any new content extraction logic against protected pages (`chrome://`), which cannot be accessed by content scripts.
