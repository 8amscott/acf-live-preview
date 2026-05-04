# Changelog

## 1.0.1 — 2026-05-04

### Fixed
- Update button no longer redirects to preview URL after using the preview panel. The hidden `wp-preview` field was being set to `dopreview` and never reset, causing the next form submission (Update) to be treated as a preview by WordPress.
- Cache busting now uses each asset's own `filemtime()` so JS-only changes invalidate the cached JS.

## 1.0.0

- Initial release: draggable, resizable live preview panel for the classic editor on ACF-powered pages.
