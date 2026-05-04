=== ACF Live Preview ===
Contributors: 8amcreative
Tags: acf, advanced custom fields, preview, live preview, classic editor
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.0.1
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Draggable, resizable live preview panel inside the WordPress classic editor for ACF-powered pages.

== Description ==

ACF Live Preview adds a floating preview panel to the classic editor when editing posts or pages that use Advanced Custom Fields. Edit an ACF field, watch the preview refresh automatically.

Features:

* Draggable, resizable preview panel
* Auto-refresh on ACF field changes (debounced)
* Manual refresh button
* Preserves the native Preview button behavior when the panel is closed
* Submits to a hidden iframe so all post + ACF fields save to an autosave revision

== Installation ==

1. Upload the `acf-live-preview` folder to `/wp-content/plugins/`
2. Activate through the Plugins menu
3. Edit any ACF-powered post or page — click the new "Preview" button bottom-right of the screen

Requires Advanced Custom Fields (free or Pro) to be active.

== Changelog ==

= 1.0.1 =
* Added: Auto-update from GitHub releases via plugin-update-checker.
* Fixed: Update button no longer redirects to preview URL after using the preview panel. The hidden `wp-preview` field was being set to `dopreview` and never reset, causing the next form submission (Update) to be treated as a preview by WordPress.
* Fixed: Cache busting now uses each asset's own `filemtime()` so JS-only changes invalidate the cached JS.

= 1.0.0 =
* Initial release.
