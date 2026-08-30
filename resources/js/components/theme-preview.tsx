import {
    fontStack,
    headingSize,
    type ThemeTokens,
    themeToCssVars,
} from '@/lib/theme';

type Props = {
    tokens: ThemeTokens;
};

const demoProducts = [
    { name: 'Cold-Pressed Juice', price: '12.90' },
    { name: 'Herbal Tea Blend', price: '8.50' },
    { name: 'Raw Almond Butter', price: '15.00' },
];

function buttonStyle(tokens: ThemeTokens): React.CSSProperties {
    const base: React.CSSProperties = {
        fontFamily: fontStack(tokens.typography.bodyFont),
        fontWeight: 600,
        fontSize: 14,
        padding: '10px 18px',
        cursor: 'default',
        borderRadius: tokens.buttonStyle === 'pill' ? 999 : `var(--sb-radius)`,
        border: '1px solid var(--sb-primary)',
    };

    if (tokens.buttonStyle === 'outline') {
        return {
            ...base,
            background: 'transparent',
            color: 'var(--sb-primary)',
        };
    }

    return {
        ...base,
        background: 'var(--sb-primary)',
        color: 'var(--sb-primary-foreground)',
    };
}

export default function ThemePreview({ tokens }: Props) {
    return (
        <div
            style={{
                ...themeToCssVars(tokens),
                background: 'var(--sb-background)',
                color: 'var(--sb-foreground)',
                fontFamily: 'var(--sb-body-font)',
                fontSize: 'var(--sb-base-size)',
            }}
            className="overflow-hidden rounded-xl border shadow-sm transition-colors"
        >
            <header
                style={{ borderColor: 'var(--sb-border)' }}
                className="flex items-center justify-between border-b px-5 py-3"
            >
                <span
                    style={{
                        fontFamily: 'var(--sb-heading-font)',
                        fontSize: headingSize(tokens.typography, 1),
                        fontWeight: 700,
                    }}
                >
                    Your Store
                </span>
                <nav
                    style={{ color: 'var(--sb-muted-foreground)' }}
                    className="flex gap-4 text-sm"
                >
                    <span>Shop</span>
                    <span>About</span>
                    <span>Cart</span>
                </nav>
            </header>

            <section
                style={{ padding: 'calc(var(--sb-spacing) * 1.5)' }}
                className="flex flex-col items-start gap-3"
            >
                <h1
                    style={{
                        fontFamily: 'var(--sb-heading-font)',
                        fontSize: headingSize(tokens.typography, 3),
                        fontWeight: 700,
                        lineHeight: 1.1,
                    }}
                >
                    Fresh, honest goods.
                </h1>
                <p
                    style={{ color: 'var(--sb-muted-foreground)' }}
                    className="max-w-sm text-sm"
                >
                    Everything your body will thank you for — sourced with care.
                </p>
                <button type="button" style={buttonStyle(tokens)}>
                    Shop the collection
                </button>
            </section>

            <section
                style={{
                    padding: 'var(--sb-spacing)',
                    gap: 'var(--sb-spacing)',
                }}
                className="grid grid-cols-3"
            >
                {demoProducts.map((product) => (
                    <div
                        key={product.name}
                        style={{
                            borderColor: 'var(--sb-border)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="overflow-hidden border"
                    >
                        <div
                            style={{ background: 'var(--sb-muted)' }}
                            className="aspect-square"
                        />
                        <div className="flex flex-col gap-0.5 p-2">
                            <span
                                style={{
                                    fontFamily: 'var(--sb-heading-font)',
                                }}
                                className="truncate text-xs font-semibold"
                            >
                                {product.name}
                            </span>
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                                className="text-xs"
                            >
                                ${product.price}
                            </span>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
