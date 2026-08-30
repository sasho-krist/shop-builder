import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { xsrfToken } from '@/lib/csrf';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import productRoutes from '@/routes/products';
import { preview, store } from '@/routes/products/import';

type Props = {
    fields: string[];
};

const NONE = '__none__';

const guesses: Record<string, string[]> = {
    title: ['title', 'name', 'product'],
    slug: ['slug', 'handle'],
    description: ['description', 'body', 'desc'],
    status: ['status'],
    price: ['price', 'amount'],
    sku: ['sku', 'code'],
    stock: ['stock', 'quantity', 'qty', 'inventory'],
    category: ['category', 'collection', 'type'],
};

const FIELD_LABELS: Record<string, string> = {
    title: 'Title',
    slug: 'Slug',
    description: 'Description',
    status: 'Status',
    price: 'Price',
    sku: 'SKU',
    stock: 'Stock',
    category: 'Category',
};

export default function ProductImport({ fields }: Props) {
    const { t } = useT();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function onFile(picked: File | undefined) {
        if (!picked) return;
        setFile(picked);
        setLoading(true);
        const body = new FormData();
        body.append('file', picked);
        try {
            const response = await fetch(preview().url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body,
            });
            const data: { headers: string[]; rows: string[][] } =
                await response.json();
            setHeaders(data.headers);
            setRows(data.rows);
            const auto: Record<string, string> = {};
            for (const field of fields) {
                const hit = data.headers.find((h) =>
                    (guesses[field] ?? []).includes(h.toLowerCase().trim()),
                );
                if (hit) auto[field] = hit;
            }
            setMapping(auto);
        } finally {
            setLoading(false);
        }
    }

    function runImport() {
        if (!file) return;
        setSubmitting(true);
        const clean: Record<string, string> = {};
        for (const [field, header] of Object.entries(mapping)) {
            if (header && header !== NONE) clean[field] = header;
        }
        router.post(
            store().url,
            { file, mapping: clean },
            {
                forceFormData: true,
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <>
            <Head title={t('Import products')} />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
                <h1 className="text-xl font-semibold">
                    {t('Import products')}
                </h1>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('CSV file')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => inputRef.current?.click()}
                        >
                            {loading ? <Spinner /> : null}
                            {file ? file.name : t('Choose a .csv file')}
                        </Button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,text/csv"
                            hidden
                            onChange={(e) => onFile(e.target.files?.[0])}
                        />
                    </CardContent>
                </Card>

                {headers.length > 0 && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Map columns')}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                {fields.map((field) => (
                                    <div key={field} className="grid gap-1.5">
                                        <Label className="text-xs">
                                            {t(FIELD_LABELS[field] ?? field)}
                                            {field === 'title' && ' *'}
                                        </Label>
                                        <Select
                                            value={mapping[field] ?? NONE}
                                            onValueChange={(value) =>
                                                setMapping((m) => ({
                                                    ...m,
                                                    [field]: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="—" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE}>
                                                    {t('— Ignore —')}
                                                </SelectItem>
                                                {headers.map((header) => (
                                                    <SelectItem
                                                        key={header}
                                                        value={header}
                                                    >
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Preview')}</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="text-muted-foreground text-left">
                                        <tr>
                                            {headers.map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-2 py-1"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => (
                                            <tr
                                                key={i}
                                                className="border-border border-t"
                                            >
                                                {headers.map((_, j) => (
                                                    <td
                                                        key={j}
                                                        className="max-w-40 truncate px-2 py-1"
                                                    >
                                                        {row[j]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Button
                            type="button"
                            className="self-start"
                            disabled={submitting || !mapping.title}
                            onClick={runImport}
                        >
                            {submitting && <Spinner />}
                            {t('Import')}
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}

ProductImport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: productRoutes.index() },
    ],
};
