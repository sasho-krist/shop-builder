import { Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import ColorField from '@/components/color-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { FieldDef, PreviewContext, PropValue } from '@/lib/blocks';
import mediaRoutes from '@/routes/media';

function ImageField({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
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
                Upload
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
    return (
        <div className="flex flex-col gap-4">
            {fields.map((field) => {
                const value = values[field.key];

                return (
                    <div key={field.key} className="grid gap-1.5">
                        {field.type !== 'boolean' && (
                            <Label className="text-xs">{field.label}</Label>
                        )}

                        {field.type === 'text' && (
                            <Input
                                value={String(value ?? '')}
                                onChange={(e) =>
                                    onChange(field.key, e.target.value)
                                }
                            />
                        )}

                        {field.type === 'textarea' && (
                            <Textarea
                                rows={3}
                                value={String(value ?? '')}
                                onChange={(e) =>
                                    onChange(field.key, e.target.value)
                                }
                            />
                        )}

                        {field.type === 'image' && (
                            <ImageField
                                value={String(value ?? '')}
                                onChange={(url) => onChange(field.key, url)}
                            />
                        )}

                        {field.type === 'color' && (
                            <ColorField
                                label=""
                                value={String(value ?? '#000000')}
                                onChange={(v) => onChange(field.key, v)}
                            />
                        )}

                        {field.type === 'select' && (
                            <Select
                                value={String(value ?? field.default)}
                                onValueChange={(v) => onChange(field.key, v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {field.type === 'number' && (
                            <div className="flex items-center gap-3">
                                <Slider
                                    min={field.min}
                                    max={field.max}
                                    step={1}
                                    value={[Number(value ?? field.default)]}
                                    onValueChange={([v]) =>
                                        onChange(field.key, v)
                                    }
                                />
                                <span className="text-muted-foreground w-6 text-right text-xs">
                                    {Number(value ?? field.default)}
                                </span>
                            </div>
                        )}

                        {field.type === 'boolean' && (
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={Boolean(value)}
                                    onCheckedChange={(checked) =>
                                        onChange(field.key, checked === true)
                                    }
                                />
                                {field.label}
                            </label>
                        )}

                        {field.type === 'collection' && (
                            <Select
                                value={value ? String(value) : 'none'}
                                onValueChange={(v) =>
                                    onChange(
                                        field.key,
                                        v === 'none' ? null : Number(v),
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
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
                        )}
                    </div>
                );
            })}
        </div>
    );
}
