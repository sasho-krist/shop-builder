import type { CSSProperties } from 'react';

export type ThemeColors = {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
};

export type ThemeTypography = {
    headingFont: string;
    bodyFont: string;
    baseSize: number;
    scale: number;
};

export type ThemeTokens = {
    colors: ThemeColors;
    typography: ThemeTypography;
    radius: number;
    spacing: number;
    container: number;
    buttonStyle: 'solid' | 'outline' | 'pill';
};

export const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'primaryForeground', label: 'Primary text' },
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Text' },
    { key: 'muted', label: 'Muted surface' },
    { key: 'mutedForeground', label: 'Muted text' },
    { key: 'border', label: 'Border' },
];

/** A CSS font-family stack for a token font name. */
export function fontStack(name: string): string {
    if (name === 'system-ui') {
        return 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    }
    const serif = ['Playfair Display', 'Merriweather'];
    const fallback = serif.includes(name)
        ? 'Georgia, serif'
        : 'system-ui, sans-serif';
    return `"${name}", ${fallback}`;
}

/** The heading size (in px) at a given step above the base size. */
export function headingSize(typography: ThemeTypography, step: number): number {
    return Math.round(typography.baseSize * typography.scale ** step);
}

/** Maps tokens to the `--sb-*` custom properties consumed by the preview / storefront. */
export function themeToCssVars(tokens: ThemeTokens): CSSProperties {
    return {
        '--sb-primary': tokens.colors.primary,
        '--sb-primary-foreground': tokens.colors.primaryForeground,
        '--sb-background': tokens.colors.background,
        '--sb-foreground': tokens.colors.foreground,
        '--sb-muted': tokens.colors.muted,
        '--sb-muted-foreground': tokens.colors.mutedForeground,
        '--sb-border': tokens.colors.border,
        '--sb-radius': `${tokens.radius}px`,
        '--sb-spacing': `${tokens.spacing}px`,
        '--sb-container': `${tokens.container}px`,
        '--sb-heading-font': fontStack(tokens.typography.headingFont),
        '--sb-body-font': fontStack(tokens.typography.bodyFont),
        '--sb-base-size': `${tokens.typography.baseSize}px`,
    } as CSSProperties;
}
