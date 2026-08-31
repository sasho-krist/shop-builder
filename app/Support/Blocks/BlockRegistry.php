<?php

namespace App\Support\Blocks;

/**
 * The valid page section types. The full schema (fields + rendering) lives in
 * the frontend registry (`resources/js/sections/*`); the backend only needs to
 * know which types are allowed.
 */
class BlockRegistry
{
    public const TYPES = [
        // Store
        'hero',
        'richText',
        'imageWithText',
        'productGrid',
        'featuredCollection',
        // Basic
        'heading',
        'textEditor',
        'image',
        'button',
        'divider',
        'spacer',
        'iconWidget',
        'blockquote',
        'alert',
        'starRating',
        'googleMap',
        'htmlEmbed',
        // Media
        'video',
        'gallery',
        'imageCarousel',
        // Content
        'iconBox',
        'imageBox',
        'iconList',
        'features',
        'testimonial',
        'team',
        'logoGrid',
        'priceList',
        'socialIcons',
        // Advanced
        'tabs',
        'accordion',
        'toggle',
        'faq',
        'counters',
        'progressBars',
        'countdown',
        'animatedHeadline',
        'testimonialCarousel',
        'priceTable',
        'callToAction',
        'flipBox',
    ];
}
