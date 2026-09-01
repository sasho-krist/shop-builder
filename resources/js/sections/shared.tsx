import {
    createContext,
    type CSSProperties,
    type ReactNode,
    useContext,
} from 'react';
import type { PreviewContext, PreviewProduct } from '@/lib/blocks';
import { useT } from '@/lib/i18n';

/** True while rendering inside a container column — sections drop their gutters. */
export const NestedContext = createContext(false);

export function hrefFor(
    ctx: PreviewContext,
    product: PreviewProduct,
): string | undefined {
    return ctx.hrefBase && product.slug
        ? `${ctx.hrefBase}${product.slug}`
        : undefined;
}

/**
 * Every section renders its content inside this shell so the storefront and the
 * page-builder preview share the same page gutters and max width. Horizontal
 * spacing lives here, never on the sections themselves.
 */
export function SectionShell({
    children,
    className = '',
    py = 2,
    full = false,
    style,
}: {
    children: ReactNode;
    className?: string;
    py?: number;
    /** Skip the max-width container (edge-to-edge sections). */
    full?: boolean;
    style?: CSSProperties;
}) {
    const nested = useContext(NestedContext);

    // Inside a column: no page gutters, no max-width, no vertical rhythm — the
    // column already handles spacing.
    if (nested) {
        return (
            <div className={className} style={style}>
                {children}
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: full ? undefined : 'var(--sb-container)',
                paddingTop: `calc(var(--sb-spacing) * ${py})`,
                paddingBottom: `calc(var(--sb-spacing) * ${py})`,
                ...style,
            }}
            className={`mx-auto w-full ${full ? '' : 'px-5 sm:px-8'} ${className}`}
        >
            {children}
        </div>
    );
}

export const ALIGN_OPTIONS = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
];

export function alignItems(align: string): string {
    if (align === 'center') return 'items-center text-center';
    if (align === 'right') return 'items-end text-right';
    return 'items-start text-left';
}

export function textAlign(align: string): CSSProperties {
    return {
        textAlign:
            align === 'center'
                ? 'center'
                : align === 'right'
                  ? 'right'
                  : 'left',
    };
}

export function Btn({
    label,
    url,
    variant = 'solid',
    size = 'md',
    className = '',
}: {
    label: string;
    url?: string;
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    if (!label) return null;

    const pad =
        size === 'sm'
            ? 'px-4 py-2 text-xs'
            : size === 'lg'
              ? 'px-7 py-3.5 text-base'
              : 'px-5 py-2.5 text-sm';

    const style: CSSProperties = {
        borderRadius: 'var(--sb-radius)',
        fontFamily: 'var(--sb-body-font)',
    };
    if (variant === 'solid') {
        style.background = 'var(--sb-primary)';
        style.color = 'var(--sb-primary-foreground)';
    } else if (variant === 'outline') {
        style.border = '1px solid var(--sb-primary)';
        style.color = 'var(--sb-primary)';
    } else {
        style.color = 'var(--sb-primary)';
    }

    const cls = `inline-block font-semibold transition-opacity hover:opacity-90 ${pad} ${className}`;
    const href = url && url.trim() !== '' ? url.trim() : undefined;

    return href ? (
        <a href={href} style={style} className={cls}>
            {label}
        </a>
    ) : (
        <button type="button" style={style} className={cls}>
            {label}
        </button>
    );
}

export function Heading({
    text,
    className = 'text-2xl font-bold',
}: {
    text: string;
    className?: string;
}) {
    if (!text) return null;
    return (
        <h2
            style={{ fontFamily: 'var(--sb-heading-font)' }}
            className={className}
        >
            {text}
        </h2>
    );
}

export function EmptyNote({ text }: { text: string }) {
    const { t } = useT();
    return (
        <p style={{ color: 'var(--sb-muted-foreground)' }} className="text-sm">
            {t(text)}
        </p>
    );
}

export function ProductCard({
    product,
    showPrice,
    href,
    size = 'md',
}: {
    product: PreviewProduct;
    showPrice: boolean;
    href?: string;
    size?: 'sm' | 'md' | 'lg';
}) {
    const Wrapper = href ? 'a' : 'div';
    const pad = size === 'sm' ? 'p-2' : size === 'lg' ? 'p-4' : 'p-3';
    const title =
        size === 'sm'
            ? 'text-xs font-medium'
            : size === 'lg'
              ? 'text-base font-semibold'
              : 'text-sm font-semibold';
    const price = size === 'sm' ? 'text-xs' : 'text-sm';

    return (
        <Wrapper
            href={href}
            style={{
                borderColor: 'var(--sb-border)',
                borderRadius: 'var(--sb-radius)',
            }}
            className="block overflow-hidden border"
        >
            <div
                style={{ background: 'var(--sb-muted)' }}
                className="aspect-square"
            >
                {product.image && (
                    <img
                        src={product.image}
                        alt={product.title}
                        className="size-full object-cover"
                    />
                )}
            </div>
            <div className={`flex flex-col gap-0.5 ${pad}`}>
                <span
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className={`truncate ${title}`}
                >
                    {product.title}
                </span>
                {showPrice && product.price && (
                    <span
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className={price}
                    >
                        {product.price}
                    </span>
                )}
            </div>
        </Wrapper>
    );
}

/** `grid-template-columns: repeat(n, ...)` via a CSS var, responsive down to 1–2. */
export function gridCols(n: number): CSSProperties {
    return { '--sb-cols': n } as CSSProperties;
}

export const GRID_CLASS =
    'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]';

/** Parse a YouTube / Vimeo watch URL into an embeddable URL. */
export function embedUrl(raw: string): string | null {
    const url = raw.trim();
    if (!url) return null;

    const yt = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
    );
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

    if (/^https?:\/\//.test(url)) return url;
    return null;
}
