<?php

namespace App\Support\Storefront;

class NavLinks
{
    public const TYPES = ['home', 'shop', 'cart', 'category', 'collection', 'page', 'url'];

    /**
     * Turn stored menu items into `{label, href}` pairs the storefront renders.
     * Items that can't resolve to a URL are dropped.
     *
     * @param  array<int, array{label?: string, type?: string, value?: string|null}>|null  $links
     * @return list<array{label: string, href: string}>
     */
    public static function resolve(?array $links): array
    {
        $resolved = [];

        foreach ($links ?? [] as $link) {
            $label = trim((string) ($link['label'] ?? ''));
            $href = self::href((string) ($link['type'] ?? ''), $link['value'] ?? null);

            if ($label === '' || $href === null) {
                continue;
            }

            $resolved[] = ['label' => $label, 'href' => $href];
        }

        return $resolved;
    }

    private static function href(string $type, ?string $value): ?string
    {
        $value = is_string($value) ? trim($value) : null;

        return match ($type) {
            'home' => '/',
            'shop' => '/products',
            'cart' => '/cart',
            'category' => $value ? "/c/{$value}" : null,
            'collection' => $value ? "/collections/{$value}" : null,
            'page' => $value ? "/{$value}" : null,
            'url' => $value !== null && $value !== '' ? $value : null,
            default => null,
        };
    }
}
