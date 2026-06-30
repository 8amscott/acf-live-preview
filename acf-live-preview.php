<?php
/**
 * Plugin Name: ACF Live Preview
 * Description: Adds a draggable, resizable live preview panel to the WordPress classic editor for ACF-powered pages.
 * Version: 1.0.2
 * Author: 8AM Creative
 * Author URI: https://8amcreative.com
 * License: GPL v2 or later
 * Requires PHP: 7.4
 * Requires at least: 5.0
 */

if (!defined('ABSPATH')) exit;

// Auto-update from GitHub releases
require __DIR__ . '/plugin-update-checker/plugin-update-checker.php';
$acfLivePreviewUpdater = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
    'https://github.com/8amscott/acf-live-preview',
    __FILE__,
    'acf-live-preview'
);
$acfLivePreviewUpdater->setBranch('main');

add_action('admin_enqueue_scripts', function($hook) {
    if ($hook !== 'post.php' && $hook !== 'post-new.php') return;
    if (!class_exists('ACF')) return;

    $url = plugin_dir_url(__FILE__);
    $dir = plugin_dir_path(__FILE__);

    wp_enqueue_script('jquery-ui-draggable');
    wp_enqueue_script('jquery-ui-resizable');
    wp_enqueue_style('acf-live-preview', $url . 'acf-preview.css', [], filemtime($dir . 'acf-preview.css'));
    wp_enqueue_script('acf-live-preview', $url . 'acf-preview.js', ['jquery', 'jquery-ui-draggable', 'jquery-ui-resizable', 'acf-input'], filemtime($dir . 'acf-preview.js'), true);

    global $post;
    if ($post) {
        $preview_url = add_query_arg([
            'preview_id'    => $post->ID,
            'preview_nonce' => wp_create_nonce('post_preview_' . $post->ID),
            'preview'       => 'true'
        ], get_permalink($post->ID));
        wp_localize_script('acf-live-preview', 'acfLivePreview', [
            'previewUrl' => $preview_url,
            'ajaxUrl'    => admin_url('admin-ajax.php'),
            'nonce'      => wp_create_nonce('acf_live_preview'),
            'postId'     => $post->ID
        ]);
    }
});

// Custom AJAX handler — saves ACF fields to autosave revision
add_action('wp_ajax_acf_live_preview_save', function() {
    check_ajax_referer('acf_live_preview', 'nonce');

    $post_id = intval($_POST['post_id']);
    if (!current_user_can('edit_post', $post_id)) {
        wp_send_json_error('Permission denied');
    }

    // Build post data for autosave
    $_POST['post_ID'] = $post_id;
    $post = get_post($post_id);
    $_POST['post_type'] = $post->post_type;
    $_POST['post_status'] = $post->post_status;
    $_POST['post_title'] = $post->post_title;
    $_POST['post_content'] = $post->post_content;

    // Create autosave revision
    $autosave_id = wp_create_post_autosave($_POST);

    // Let ACF save its fields to the autosave
    if ($autosave_id && class_exists('ACF')) {
        acf_save_post($autosave_id);
    }

    wp_send_json_success(['autosave_id' => $autosave_id]);
});
