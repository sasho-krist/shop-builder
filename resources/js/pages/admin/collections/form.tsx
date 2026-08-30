import { Head, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import CollectionProductPicker, {
    type PickerProduct,
} from '@/components/collection-product-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import collectionRoutes from '@/routes/collections';

type CollectionData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    is_visible: boolean;
    products: PickerProduct[];
};

type Props = {
    collection: CollectionData | null;
};

export default function CollectionForm({ collection }: Props) {
    const { t } = useT();
    const isEdit = collection !== null;

    const form = useForm<{
        title: string;
        slug: string;
        description: string;
        is_visible: boolean;
        products: PickerProduct[];
        product_ids: number[];
    }>({
        title: collection?.title ?? '',
        slug: collection?.slug ?? '',
        description: collection?.description ?? '',
        is_visible: collection?.is_visible ?? true,
        products: collection?.products ?? [],
        product_ids: collection?.products.map((product) => product.id) ?? [],
    });

    function setProducts(products: PickerProduct[]) {
        form.setData((data) => ({
            ...data,
            products,
            product_ids: products.map((product) => product.id),
        }));
    }

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        form.transform((data) => ({
            title: data.title,
            slug: data.slug,
            description: data.description,
            is_visible: data.is_visible,
            product_ids: data.product_ids,
        }));

        if (isEdit) {
            form.put(collectionRoutes.update(collection.id).url);
        } else {
            form.post(collectionRoutes.store().url);
        }
    };

    return (
        <>
            <Head title={isEdit ? collection.title : t('New collection')} />

            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4"
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        {isEdit ? collection.title : t('New collection')}
                    </h1>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {isEdit ? t('Save') : t('Create')}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">{t('Title')}</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                autoFocus
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug">
                                {t('Slug')}{' '}
                                <span className="text-muted-foreground font-normal">
                                    {t('(leave blank to generate from title)')}
                                </span>
                            </Label>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                placeholder={t('auto')}
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                            />
                            <InputError message={form.errors.slug} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                {t('Description')}
                            </Label>
                            <Textarea
                                id="description"
                                rows={4}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.data.is_visible}
                                onCheckedChange={(checked) =>
                                    form.setData('is_visible', checked === true)
                                }
                            />
                            {t('Visible on storefront')}
                        </label>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('Products (:count)', {
                                count: form.data.products.length,
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CollectionProductPicker
                            selected={form.data.products}
                            onChange={setProducts}
                        />
                        <InputError message={form.errors.product_ids} />
                    </CardContent>
                </Card>
            </form>
        </>
    );
}

CollectionForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Collections', href: collectionRoutes.index() },
    ],
};
