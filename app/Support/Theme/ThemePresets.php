<?php

namespace App\Support\Theme;

/**
 * Built-in starting points for a store theme. The token shape here is the
 * single source of truth for what `themes.tokens` may contain.
 */
class ThemePresets
{
    public const COLOR_KEYS = [
        'primary', 'primaryForeground', 'background', 'foreground',
        'muted', 'mutedForeground', 'border',
    ];

    public const FONTS = [
        'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
        'Playfair Display', 'Merriweather', 'system-ui',
    ];

    public const BUTTON_STYLES = ['solid', 'outline', 'pill'];

    /**
     * @return array<string, array{label: string, tokens: array<string, mixed>}>
     */
    public static function all(): array
    {
        return [
            'minimal' => [
                'label' => 'Minimal',
                'tokens' => self::minimal(),
            ],
            'bold' => [
                'label' => 'Bold',
                'tokens' => self::bold(),
            ],
            'classic' => [
                'label' => 'Classic',
                'tokens' => self::classic(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function tokens(string $key): array
    {
        return self::all()[$key]['tokens'] ?? self::minimal();
    }

    /**
     * @return array<string, mixed>
     */
    public static function minimal(): array
    {
        return [
            'colors' => [
                'primary' => '#111827',
                'primaryForeground' => '#ffffff',
                'background' => '#ffffff',
                'foreground' => '#111827',
                'muted' => '#f3f4f6',
                'mutedForeground' => '#6b7280',
                'border' => '#e5e7eb',
            ],
            'typography' => [
                'headingFont' => 'Inter',
                'bodyFont' => 'Inter',
                'baseSize' => 16,
                'scale' => 1.2,
            ],
            'radius' => 8,
            'spacing' => 16,
            'container' => 1200,
            'buttonStyle' => 'solid',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function bold(): array
    {
        return [
            'colors' => [
                'primary' => '#7c3aed',
                'primaryForeground' => '#ffffff',
                'background' => '#0b0b12',
                'foreground' => '#f5f5f7',
                'muted' => '#1c1c26',
                'mutedForeground' => '#a1a1aa',
                'border' => '#2a2a37',
            ],
            'typography' => [
                'headingFont' => 'Poppins',
                'bodyFont' => 'Inter',
                'baseSize' => 17,
                'scale' => 1.333,
            ],
            'radius' => 16,
            'spacing' => 20,
            'container' => 1320,
            'buttonStyle' => 'pill',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function classic(): array
    {
        return [
            'colors' => [
                'primary' => '#166534',
                'primaryForeground' => '#ffffff',
                'background' => '#fdfcf9',
                'foreground' => '#1c1917',
                'muted' => '#f0eee7',
                'mutedForeground' => '#78716c',
                'border' => '#e2ddd2',
            ],
            'typography' => [
                'headingFont' => 'Playfair Display',
                'bodyFont' => 'Merriweather',
                'baseSize' => 16,
                'scale' => 1.25,
            ],
            'radius' => 2,
            'spacing' => 16,
            'container' => 1140,
            'buttonStyle' => 'outline',
        ];
    }
}
