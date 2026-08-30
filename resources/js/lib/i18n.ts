import { usePage } from '@inertiajs/react';

type I18nShared = {
    locale?: string;
    i18n?: Record<string, string>;
};

export type Translator = (
    key: string,
    replace?: Record<string, string | number>,
) => string;

/**
 * UI translations for the storefront and the admin panel. English is the source
 * language — a missing key just renders as-is. Supports `:name` placeholders.
 */
export function useT(): { t: Translator; locale: string } {
    const props = usePage<I18nShared>().props;
    const dict = props.i18n ?? {};
    const locale = props.locale ?? 'en';

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
