import { Head } from '@inertiajs/react';
import { fontStack, type ThemeTokens, themeToCssVars } from '@/lib/theme';

type Props = {
    store: {
        name: string;
    };
    theme: ThemeTokens;
};

export default function ComingSoon({ store, theme }: Props) {
    return (
        <>
            <Head title={store.name} />

            <div
                style={{
                    ...themeToCssVars(theme),
                    background: 'var(--sb-background)',
                    color: 'var(--sb-foreground)',
                    fontFamily: 'var(--sb-body-font)',
                }}
                className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center"
            >
                <h1
                    style={{
                        fontFamily: fontStack(theme.typography.headingFont),
                    }}
                    className="text-3xl font-semibold tracking-tight"
                >
                    {store.name}
                </h1>
                <p
                    style={{ color: 'var(--sb-muted-foreground)' }}
                    className="max-w-md text-sm"
                >
                    This store is being set up. Check back soon.
                </p>
                <span
                    className="mt-2 h-1 w-16"
                    style={{
                        background: 'var(--sb-primary)',
                        borderRadius: 'var(--sb-radius)',
                    }}
                />
            </div>
        </>
    );
}
