jQuery(function($) {

    if (typeof acf === 'undefined') return;
    var previewUrl = (typeof acfLivePreview !== 'undefined' && acfLivePreview.previewUrl) || '';
    if (!previewUrl) return;

    // Build panel
    var $toggle = $('<button class="acf-preview-toggle" type="button">Preview</button>');
    var $panel = $(`
        <div class="acf-preview-panel">
            <div class="acf-preview-drag-resize ui-resizable-handle ui-resizable-nw"><svg viewBox="0 0 14 14"><line x1="1" y1="5" x2="5" y2="1"/><line x1="1" y1="9" x2="9" y2="1"/><line x1="1" y1="13" x2="13" y2="1"/><line x1="5" y1="13" x2="13" y2="5"/><line x1="9" y1="13" x2="13" y2="9"/></svg></div>
            <div class="acf-preview-toolbar">
                <div class="acf-preview-left"></div>
                <span>Preview</span>
                <div class="acf-preview-actions">
                    <span class="acf-preview-status"></span>
                    <button type="button" class="acf-preview-refresh">Refresh</button>
                    <button type="button" class="acf-preview-close"><svg viewBox="0 0 14 14"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg></button>
                </div>
            </div>
            <div class="acf-preview-body">
                <div class="acf-preview-scaler">
                </div>
            </div>
        </div>
    `);

    // Create iframe with native DOM — jQuery can fail to set name on iframes
    var rawIframe = document.createElement('iframe');
    rawIframe.name = 'acf-lp';
    $panel.find('.acf-preview-scaler').append(rawIframe);

    $('body').append($toggle).append($panel);

    var $iframe = $(rawIframe);
    var $scaler = $panel.find('.acf-preview-scaler');
    var $body = $panel.find('.acf-preview-body');
    var $status = $panel.find('.acf-preview-status');
    var debounceTimer;
    var iframeWidth = 1440;

    function scalePreview() {
        var panelW = $body.width();
        var panelH = $body.height();
        var scale = panelW / iframeWidth;
        $scaler.css({ transform: 'scale(' + scale + ')', height: (panelH / scale) + 'px' });
        $iframe.css('height', (panelH / scale) + 'px');
    }

    // The save function — submits the form to our iframe
    // post.php saves everything (including ACF), then redirects to preview URL inside our iframe
    // Fresh hidden iframe for each save
    var saving = false;
    function triggerPreview() {
        if (saving) return;
        saving = true;
        $status.text('Saving...');
        $panel.addClass('acf-preview-loading');

        // Commit field values and sync editors
        document.activeElement.blur();
        if (typeof tinyMCE !== 'undefined') tinyMCE.triggerSave();

        // Fresh hidden iframe for form save
        var saveName = 'acf_save_' + Date.now();
        var saveFrame = document.createElement('iframe');
        saveFrame.name = saveName;
        saveFrame.style.cssText = 'display:none';
        document.body.appendChild(saveFrame);

        var $form = $('form#post');
        var $wpPreview = $form.find('#wp-preview');
        $wpPreview.val('dopreview');
        $form.attr('target', saveName).submit().attr('target', '');
        // WebKit needs a tick before clearing or it ignores the next submit
        setTimeout(function() { $wpPreview.val(''); }, 100);

        setTimeout(function() {
            try { document.body.removeChild(saveFrame); } catch(e) {}

            $status.text('Loading...');
            $iframe.one('load', function() {
                $status.text('');
                $panel.removeClass('acf-preview-loading');
                saving = false;
            });
            $iframe.attr('src', previewUrl + '&t=' + Date.now());
        }, 2500);
    }

    // Native Preview button: if panel is open, refresh it; if closed, let default new tab happen
    $('#post-preview').on('click.acf-preview', function(e) {
        if ($panel.hasClass('open')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            triggerPreview();
        }
    });

    // Our toggle button
    $toggle.on('click', function() {
        $panel.addClass('open');
        $toggle.hide();
        scalePreview();
        triggerPreview();
    });

    // Close
    $panel.on('click', '.acf-preview-close', function() {
        $panel.removeClass('open');
        $toggle.show();
    });

    // Refresh
    $panel.on('click', '.acf-preview-refresh', function() {
        triggerPreview();
    });

    // Admin bar offsets
    var adminBarH = $('#wpadminbar').outerHeight() || 32;
    var adminSidebarW = $('#adminmenuwrap').outerWidth() || 160;
    var padTop = adminBarH + 20;
    var padLeft = adminSidebarW + 20;

    // Draggable
    $panel.draggable({
        handle: '.acf-preview-toolbar',
        cancel: 'button',
        drag: function(e, ui) {
            var w = $panel.outerWidth(), h = $panel.outerHeight();
            ui.position.left = Math.max(padLeft, Math.min(ui.position.left, $(window).width() - w - 20));
            ui.position.top = Math.max(padTop, Math.min(ui.position.top, $(window).height() - h - 20));
        }
    });

    // Resizable
    $panel.resizable({
        minWidth: 278,
        minHeight: 240,
        handles: { 'nw': $panel.find('.acf-preview-drag-resize') },
        start: function() { $iframe.css('pointer-events', 'none'); },
        resize: function(e, ui) {
            var right = ui.originalPosition.left + ui.originalSize.width;
            var bottom = ui.originalPosition.top + ui.originalSize.height;
            var maxW = right - padLeft;
            var maxH = bottom - padTop;
            if (ui.size.width > maxW) ui.size.width = maxW;
            if (ui.size.height > maxH) ui.size.height = maxH;
            ui.position.left = right - ui.size.width;
            ui.position.top = bottom - ui.size.height;
            $panel.css({ width: ui.size.width, height: ui.size.height });
            scalePreview();
        },
        stop: function() { $iframe.css('pointer-events', ''); }
    });

    // ACF field change → debounced save + refresh
    function queueRefresh() {
        if (!$panel.hasClass('open')) return;
        clearTimeout(debounceTimer);
        $status.text('Editing...');
        debounceTimer = setTimeout(triggerPreview, 2000);
    }
    acf.addAction('change', queueRefresh);
    acf.addAction('input', queueRefresh);
    $(document).on('input', '.acf-field input, .acf-field textarea', queueRefresh);

    $(window).on('resize', function() {
        if ($panel.hasClass('open')) scalePreview();
    });

});
