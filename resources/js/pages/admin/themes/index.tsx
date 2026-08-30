import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { COLOR_FIELDS, type ThemeTokens } from '@/lib/theme';
import { dashboard } from '@/routes';
import themeRoutes from '@/routes/themes';

type Theme = {
    id: number;
    name: string;
    is_active: boolean;
    tokens: ThemeTokens;
};

type Preset = {
    key: string;
    label: string;
    tokens: ThemeTokens;
};

type Props = {
    themes: Theme[];
    presets: Preset[];
};

export default function ThemesIndex({ themes, presets }: Props) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', preset: presets[0]?.key ?? 'minimal' });

    function create(event: React.FormEvent) {
        event.preventDefault();
        form.post(themeRoutes.store().url, { onSuccess: () => setOpen(false) });
    }

    function activate(theme: Theme) {
        router.post(
            themeRoutes.activate(theme.id).url,
            {},
            { preserveScroll: true },
        );
    }

    function destroy(theme: Theme) {
        if (confirm(t('Delete the ":name" theme?', { name: theme.name }))) {
            router.delete(themeRoutes.destroy(theme.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title={t('Themes')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{t('Themes')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t('The active theme styles your storefront.')}
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            form.reset();
                            form.clearErrors();
                            setOpen(true);
                        }}
                    >
                        {t('New theme')}
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {themes.map((theme) => (
                        <div
                            key={theme.id}
                            className="border-border animate-in fade-in flex flex-col gap-3 rounded-xl border p-4 duration-200"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {theme.name}
                                </span>
                                {theme.is_active && (
                                    <Badge>{t('Active')}</Badge>
                                )}
                            </div>

                            <div className="flex gap-1">
                                {COLOR_FIELDS.map(({ key }) => (
                                    <span
                                        key={key}
                                        className="border-border size-6 rounded-md border"
                                        style={{
                                            background:
                                                theme.tokens.colors[key],
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="mt-auto flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.get(
                                            themeRoutes.edit(theme.id).url,
                                        )
                                    }
                                >
                                    {t('Edit')}
                                </Button>
                                {!theme.is_active && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => activate(theme)}
                                    >
                                        {t('Activate')}
                                    </Button>
                                )}
                                {!theme.is_active && themes.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={() => destroy(theme)}
                                    >
                                        {t('Delete')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('New theme')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={create} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="theme-name">{t('Name')}</Label>
                            <Input
                                id="theme-name"
                                value={form.data.name}
                                autoFocus
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="theme-preset">
                                {t('Start from')}
                            </Label>
                            <Select
                                value={form.data.preset}
                                onValueChange={(value) =>
                                    form.setData('preset', value)
                                }
                            >
                                <SelectTrigger id="theme-preset">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {presets.map((preset) => (
                                        <SelectItem
                                            key={preset.key}
                                            value={preset.key}
                                        >
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ThemesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Themes', href: themeRoutes.index() },
    ],
};
