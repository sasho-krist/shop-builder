import {
    ArrowDown,
    ArrowUp,
    Loader2,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import ColorField from '@/components/color-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type {
    FieldDef,
    PreviewContext,
    PropValue,
    RepeaterFieldDef,
    RepeaterItem,
} from '@/lib/blocks';
import { blankRow } from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import { ICON_NAMES, IconGlyph } from '@/sections/icons';
import mediaRoutes from '@/routes/media';

function ImageField({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const { t } = useT();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function upload(file: File | undefined) {
        if (!file) return;
        setUploading(true);
        const body = new FormData();
        body.append('file', file);
        try {
            const response = await fetch(mediaRoutes.store().url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                body,
            });
            const data: { url?: string } = await response.json();
            if (data.url) onChange(data.url);
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    return (
        <div className="flex items-center gap-2">
            {value ? (
                <img
                    src={value}
                    alt=""
                    className="bg-muted size-12 rounded-md object-cover"
                />
            ) : (
                <div className="bg-muted size-12 rounded-md" />
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Upload className="size-4" />
                )}
                {t('Upload')}
            </Button>
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onChange('')}
                >
                    <X className="size-4" />
                </Button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => upload(event.target.files?.[0])}
            />
        </div>
    );
}

function IconField({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setOpen(true)}
            >
                <IconGlyph name={value || 'star'} className="size-4" />
                {value || t('Choose an icon')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Choose an icon')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid max-h-80 grid-cols-8 gap-1 overflow-y-auto">
                        {ICON_NAMES.map((name) => (
                            <button
                                key={name}
                                type="button"
                                title={name}
                                onClick={() => {
                                    onChange(name);
                                    setOpen(false);
                                }}
                                className={`hover:bg-accent flex aspect-square items-center justify-center rounded-md ${
                                    name === value ? 'bg-accent' : ''
                                }`}
                            >
                                <IconGlyph name={name} className="size-5" />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

type AnyField = FieldDef | RepeaterFieldDef;

function FieldInput({
    field,
    value: rawValue,
    ctx,
    onChange,
}: {
    field: AnyField;
    value: PropValue | undefined;
    ctx: PreviewContext;
    onChange: (value: PropValue) => void;
}) {
    const { t } = useT();
    // Non-repeater fields never hold an array; narrow it away for stringify.
    const value: string | number | boolean | null | undefined = Array.isArray(
        rawValue,
    )
        ? undefined
        : rawValue;

    switch (field.type) {
        case 'text':
            return (
                <Input
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case 'textarea':
            return (
                <Textarea
                    rows={3}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case 'html':
            return (
                <Textarea
                    rows={8}
                    className="font-mono text-xs"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case 'image':
            return (
                <ImageField
                    value={String(value ?? '')}
                    onChange={(url) => onChange(url)}
                />
            );
        case 'icon':
            return (
                <IconField
                    value={String(value ?? '')}
                    onChange={(name) => onChange(name)}
                />
            );
        case 'color':
            return (
                <ColorField
                    label=""
                    value={String(value ?? '#000000')}
                    onChange={(v) => onChange(v)}
                />
            );
        case 'select':
            return (
                <Select
                    value={String(value ?? field.default)}
                    onValueChange={(v) => onChange(v)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {t(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'number': {
            const current = Number(value ?? field.default);
            const span = field.max - field.min;

            // Short ranges (columns, small counts) are far easier to set with
            // buttons than a slider with two or three stops.
            if (span <= 8) {
                return (
                    <div className="flex flex-wrap gap-1">
                        {Array.from(
                            { length: span + 1 },
                            (_, i) => field.min + i,
                        ).map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChange(n)}
                                className={`h-8 min-w-8 rounded-md border px-2 text-sm ${
                                    n === current
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-input hover:bg-accent'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                );
            }

            return (
                <div className="flex items-center gap-3">
                    <Slider
                        min={field.min}
                        max={field.max}
                        step={1}
                        value={[current]}
                        onValueChange={([v]) => onChange(v)}
                    />
                    <span className="text-muted-foreground w-10 text-right text-xs">
                        {current}
                    </span>
                </div>
            );
        }
        case 'boolean':
            return (
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={Boolean(value)}
                        onCheckedChange={(checked) =>
                            onChange(checked === true)
                        }
                    />
                    {t(field.label)}
                </label>
            );
        case 'collection':
            return (
                <Select
                    value={value ? String(value) : 'none'}
                    onValueChange={(v) =>
                        onChange(v === 'none' ? null : Number(v))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('Choose a collection')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">{t('None')}</SelectItem>
                        {ctx.collections.map((collection) => (
                            <SelectItem
                                key={collection.id}
                                value={String(collection.id)}
                            >
                                {collection.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'category':
            return (
                <Select
                    value={value ? String(value) : 'none'}
                    onValueChange={(v) =>
                        onChange(v === 'none' ? null : Number(v))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('Choose a category')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">{t('None')}</SelectItem>
                        {ctx.categories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={String(category.id)}
                            >
                                {category.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        default:
            return null;
    }
}

function RepeaterField({
    field,
    value,
    ctx,
    onChange,
}: {
    field: Extract<FieldDef, { type: 'repeater' }>;
    value: RepeaterItem[];
    ctx: PreviewContext;
    onChange: (rows: RepeaterItem[]) => void;
}) {
    const { t } = useT();
    const items = Array.isArray(value) ? value : [];

    const patch = (i: number, next: RepeaterItem) =>
        onChange(items.map((row, idx) => (idx === i ? next : row)));
    const move = (i: number, dir: -1 | 1) => {
        const to = i + dir;
        if (to < 0 || to >= items.length) return;
        const copy = [...items];
        [copy[i], copy[to]] = [copy[to], copy[i]];
        onChange(copy);
    };

    return (
        <div className="flex flex-col gap-2">
            {items.map((row, i) => (
                <div
                    key={i}
                    className="border-border flex flex-col gap-2 rounded-md border p-2"
                >
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>
                            {t(field.itemLabel)} {i + 1}
                        </span>
                        <div className="flex">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                disabled={i === 0}
                                onClick={() => move(i, -1)}
                            >
                                <ArrowUp className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                disabled={i === items.length - 1}
                                onClick={() => move(i, 1)}
                            >
                                <ArrowDown className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={() =>
                                    onChange(
                                        items.filter((_, idx) => idx !== i),
                                    )
                                }
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                    {field.fields.map((sub: RepeaterFieldDef) => (
                        <div key={sub.key} className="grid gap-1">
                            {sub.type !== 'boolean' && (
                                <Label className="text-[11px]">
                                    {t(sub.label)}
                                </Label>
                            )}
                            <FieldInput
                                field={sub}
                                value={row[sub.key]}
                                ctx={ctx}
                                onChange={(v) =>
                                    patch(i, {
                                        ...row,
                                        [sub.key]: v as
                                            | string
                                            | number
                                            | boolean,
                                    })
                                }
                            />
                        </div>
                    ))}
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={field.max !== undefined && items.length >= field.max}
                onClick={() => onChange([...items, blankRow(field.fields)])}
            >
                <Plus className="size-4" />
                {t('Add :item', { item: t(field.itemLabel).toLowerCase() })}
            </Button>
        </div>
    );
}

type Props = {
    fields: FieldDef[];
    values: Record<string, PropValue>;
    ctx: PreviewContext;
    onChange: (key: string, value: PropValue) => void;
};

export default function SectionFields({
    fields,
    values,
    ctx,
    onChange,
}: Props) {
    const { t } = useT();

    return (
        <div className="flex flex-col gap-4">
            {fields.map((field) => {
                const value = values[field.key];

                if (field.type === 'repeater') {
                    return (
                        <div key={field.key} className="grid gap-1.5">
                            <Label className="text-xs">{t(field.label)}</Label>
                            <RepeaterField
                                field={field}
                                value={
                                    Array.isArray(value) ? value : field.default
                                }
                                ctx={ctx}
                                onChange={(rows) => onChange(field.key, rows)}
                            />
                        </div>
                    );
                }

                return (
                    <div key={field.key} className="grid gap-1.5">
                        {field.type !== 'boolean' && (
                            <Label className="text-xs">{t(field.label)}</Label>
                        )}
                        <FieldInput
                            field={field}
                            value={value}
                            ctx={ctx}
                            onChange={(v) => onChange(field.key, v)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
