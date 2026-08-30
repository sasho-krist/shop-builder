<?php

namespace App\Support\Blocks;

/**
 * The valid page section types. The full schema (fields + rendering) lives in
 * the frontend registry (`resources/js/sections/registry.tsx`); the backend
 * only needs to know which types are allowed.
 */
class BlockRegistry
{
    public const TYPES = [
        'hero',
        'richText',
        'imageWithText',
        'productGrid',
        'featuredCollection',
    ];
}
