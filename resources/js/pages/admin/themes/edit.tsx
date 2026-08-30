import { Head, router, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import ColorField from '@/components/color-field';
import ThemePreview from '@/components/theme-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useT } from '@/lib/i18n';
import { COLOR_FIELDS, type ThemeColors, type ThemeTokens } from '@/lib/theme';
import { dashboard } from '@/routes';
import themeRoutes from '@/routes/themes';

type Theme = {
    id: number;
    name: string;
    is_active: boolean;
    tokens: ThemeTokens;
};

type Preset = { key: string; label: string; tokens: ThemeTokens };

type Props = {
    theme: Theme;
    presets: Preset[];
    fonts: string[];
    buttonStyles: string[];
};

function Row({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
                <Label className="text-sm">{label}</Label>
                {hint && (
                    <span className="text-muted-foreground text-xs">
                        {hint}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

export default function ThemeEdit({
    theme,
    presets,
    fonts,
    buttonStyles,
}: Props) {
    const { t: tr } = useT();
    const form = useForm<{ name: string; tokens: ThemeTokens }>({
        name: theme.name,
        tokens: theme.tokens,
    });

    const t = form.data.tokens;

    function patch(next: Partial<ThemeTokens>) {
        form.setData('tokens', { ...t, ...next });
    }

    function setColor(key: keyof ThemeColors, value: string) {
        patch({ colors: { ...t.colors, [key]: value } });
    }

    function setTypography(next: Partial<ThemeTokens['typography']>) {
        patch({ typography: { ...t.typography, ...next } });
    }

    function applyPreset(preset: Preset) {
        if (
            confirm(
                tr('Replace all values with the ":preset" preset?', {
                    preset: preset.label,
                }),
            )
        ) {
            form.setData('tokens', preset.tokens);
        }
    }

    const errors = form.errors as Record<string, string>;

    function save(event: React.FormEvent) {
        event.preventDefault();
        form.put(themeRoutes.update(theme.id).url, { preserveScroll: true });
    }

    return (
        <>
            <Head title={tr(':name — theme', { name: theme.name })} />

            <form onSubmit={save} className="flex h-full flex-1 flex-col">
                <div className="border-border flex items-center gap-3 border-b p-4">
                    <Input
                        value={form.data.name}
                        className="max-w-xs font-medium"
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                    {theme.is_active ? (
                        <Badge>{tr('Active')}</Badge>
                    ) : (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                router.post(
                                    themeRoutes.activate(theme.id).url,
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            {tr('Activate')}
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="ml-auto"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        {tr('Save')}
                    </Button>
                </div>

                <div className="grid flex-1 gap-6 overflow-hidden lg:grid-cols-[minmax(0,360px)_1fr]">
                    <div className="flex flex-col gap-6 overflow-y-auto p-4">
                        <section className="flex flex-col gap-2">
                            <h2 className="text-sm font-semibold">
                                {tr('Start from a preset')}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {presets.map((preset) => (
                                    <Button
                                        key={preset.key}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyPreset(preset)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold">
                                {tr('Colours')}
                            </h2>
                            {COLOR_FIELDS.map(({ key, label }) => (
                                <ColorField
                                    key={key}
                                    label={tr(label)}
                                    value={t.colors[key]}
                                    onChange={(value) => setColor(key, value)}
                                />
                            ))}
                            <InputError message={errors['tokens.colors']} />
                        </section>

                        <section className="flex flex-col gap-4">
                            <h2 className="text-sm font-semibold">
                                {tr('Typography')}
                            </h2>
                            <Row label={tr('Heading font')}>
                                <Select
                                    value={t.typography.headingFont}
                                    onValueChange={(value) =>
                                        setTypography({ headingFont: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fonts.map((font) => (
                                            <SelectItem key={font} value={font}>
                                                {font}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Row>
                            <Row label={tr('Body font')}>
                                <Select
                                    value={t.typography.bodyFont}
                                    onValueChange={(value) =>
                                        setTypography({ bodyFont: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fonts.map((font) => (
                                            <SelectItem key={font} value={font}>
                                                {font}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Row>
                            <Row
                                label={tr('Base size')}
                                hint={`${t.typography.baseSize}px`}
                            >
                                <Slider
                                    min={12}
                                    max={24}
                                    step={1}
                                    value={[t.typography.baseSize]}
                                    onValueChange={([value]) =>
                                        setTypography({ baseSize: value })
                                    }
                                />
                            </Row>
                            <Row
                                label={tr('Type scale')}
                                hint={t.typography.scale.toFixed(2)}
                            >
                                <Slider
                                    min={1}
                                    max={1.7}
                                    step={0.01}
                                    value={[t.typography.scale]}
                                    onValueChange={([value]) =>
                                        setTypography({
                                            scale:
                                                Math.round(value * 100) / 100,
                                        })
                                    }
                                />
                            </Row>
                        </section>

                        <section className="flex flex-col gap-4">
                            <h2 className="text-sm font-semibold">
                                {tr('Layout')}
                            </h2>
                            <Row
                                label={tr('Corner radius')}
                                hint={`${t.radius}px`}
                            >
                                <Slider
                                    min={0}
                                    max={32}
                                    step={1}
                                    value={[t.radius]}
                                    onValueChange={([value]) =>
                                        patch({ radius: value })
                                    }
                                />
                            </Row>
                            <Row label={tr('Spacing')} hint={`${t.spacing}px`}>
                                <Slider
                                    min={8}
                                    max={40}
                                    step={1}
                                    value={[t.spacing]}
                                    onValueChange={([value]) =>
                                        patch({ spacing: value })
                                    }
                                />
                            </Row>
                            <Row
                                label={tr('Container width')}
                                hint={`${t.container}px`}
                            >
                                <Slider
                                    min={900}
                                    max={1800}
                                    step={20}
                                    value={[t.container]}
                                    onValueChange={([value]) =>
                                        patch({ container: value })
                                    }
                                />
                            </Row>
                            <Row label={tr('Button style')}>
                                <ToggleGroup
                                    type="single"
                                    value={t.buttonStyle}
                                    onValueChange={(value) =>
                                        value &&
                                        patch({
                                            buttonStyle:
                                                value as ThemeTokens['buttonStyle'],
                                        })
                                    }
                                    className="justify-start"
                                >
                                    {buttonStyles.map((style) => (
                                        <ToggleGroupItem
                                            key={style}
                                            value={style}
                                        >
                                            {tr(`buttonStyle.${style}`)}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </Row>
                        </section>
                    </div>

                    <div className="overflow-y-auto p-4">
                        <div className="sticky top-0">
                            <p className="text-muted-foreground mb-2 text-xs">
                                {tr('Live preview')}
                            </p>
                            <ThemePreview tokens={t} />
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

ThemeEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Themes', href: themeRoutes.index() },
    ],
};
