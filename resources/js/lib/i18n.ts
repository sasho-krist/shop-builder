import { usePage } from '@inertiajs/react';

type I18nShared = {
    storefront?: {
        locale?: string;
        i18n?: Record<string, string>;
    } | null;
};

export type Translator = (
    key: string,
    replace?: Record<string, string | number>,
) => string;

/**
 * Storefront translations. English is the source language — a missing key just
 * renders as-is. Supports `:name` style placeholders.
 */
export function useT(): { t: Translator; locale: string } {
    const storefront = usePage<I18nShared>().props.storefront;
    const dict = storefront?.i18n ?? {};
    const locale = storefront?.locale ?? 'en';

    const t: Translator = (key, replace) => {
        let out = dict[key] ?? key;
        if (replace) {
            for (const [k, v] of Object.entries(replace)) {
                out = out.split(`:${k}`).join(String(v));
            }
        }
        return out;
    };

    return { t, locale };
}
