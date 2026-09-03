<?php

namespace App\Support\Storefront;

class HeaderCenter
{
    public const TYPES = ['none', 'search', 'contact', 'text'];

    /**
     * Normalise the stored header-centre config into what the storefront renders,
     * or null when there is nothing to show.
     *
     * @param  array{type?: string, text?: string|null, phone?: string|null, email?: string|null}|null  $center
     * @return array{type: string, text?: string, phone?: string|null, email?: string|null}|null
     */
    public static function resolve(?array $center): ?array
    {
        if ($center === null) {
            return null;
        }

        $type = is_string($center['type'] ?? null) ? $center['type'] : 'none';
        $text = trim((string) ($center['text'] ?? ''));
        $phone = trim((string) ($center['phone'] ?? ''));
        $email = trim((string) ($center['email'] ?? ''));

        return match ($type) {
            'search' => ['type' => 'search'],
            'contact' => $phone !== '' || $email !== ''
                ? ['type' => 'contact', 'phone' => $phone ?: null, 'email' => $email ?: null]
                : null,
            'text' => $text !== '' ? ['type' => 'text', 'text' => $text] : null,
            default => null,
        };
    }
}
