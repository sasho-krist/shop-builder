import { Head, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import ProductImageManager, {
    type ProductImage,
} from '@/components/product-image-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import productRoutes from '@/routes/products';

type Variant = {
    id?: number;
    name: string;
    sku: string;
    price: string;
    compare_at_price: string;
    stock_quantity: string;
};

type CategoryOption = {
    id: number;
    name: string;
    parent_id: number | null;
};

type ProductData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    status: string;
    seo_title: string | null;
    seo_description: string | null;
    variants: Variant[];
    category_ids: number[];
    images: ProductImage[];
};

type Props = {
    product: ProductData | null;
    statuses: string[];
    categories: CategoryOption[];
};

function categoryDepth(
    all: CategoryOption[],
    category: CategoryOption,
): number {
    let depth = 0;
    let parentId = category.parent_id;
    while (parentId !== null) {
        depth += 1;
        parentId = all.find((c) => c.id === parentId)?.parent_id ?? null;
    }
    return depth;
}

function blankVariant(): Variant {
    return {
        name: 'Default',
        sku: '',
        price: '',
        compare_at_price: '',
        stock_quantity: '0',
    };
}

function toFormVariant(variant: Variant): Variant {
    return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku ?? '',
        price: String(variant.price ?? ''),
        compare_at_price:
            variant.compare_at_price === null ||
            variant.compare_at_price === undefined
                ? ''
                : String(variant.compare_at_price),
        stock_quantity: String(variant.stock_quantity ?? '0'),
    };
}

export default function ProductForm({ product, statuses, categories }: Props) {
    const isEdit = product !== null;

    const form = useForm({
        title: product?.title ?? '',
        slug: product?.slug ?? '',
        description: product?.description ?? '',
        status: product?.status ?? statuses[0],
        seo_title: product?.seo_title ?? '',
        seo_description: product?.seo_description ?? '',
        variants: product
            ? product.variants.map(toFormVariant)
            : [blankVariant()],
        category_ids: product?.category_ids ?? [],
    });

    function toggleCategory(id: number, checked: boolean) {
        form.setData(
            'category_ids',
            checked
                ? [...form.data.category_ids, id]
                : form.data.category_ids.filter((value) => value !== id),
        );
    }

    const errors = form.errors as Record<string, string>;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (isEdit) {
            form.put(productRoutes.update(product.id).url);
        } else {
            form.post(productRoutes.store().url);
        }
    };

    function updateVariant(index: number, key: keyof Variant, value: string) {
        form.setData(
            'variants',
            form.data.variants.map((variant, i) =>
                i === index ? { ...variant, [key]: value } : variant,
            ),
        );
    }

    function addVariant() {
        form.setData('variants', [...form.data.variants, blankVariant()]);
    }

    function removeVariant(index: number) {
        form.setData(
            'variants',
            form.data.variants.filter((_, i) => i !== index),
        );
    }

    return (
        <>
            <Head title={isEdit ? product.title : 'New product'} />

            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4"
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        {isEdit ? product.title : 'New product'}
                    </h1>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {isEdit ? 'Save' : 'Create'}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
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
                                Slug{' '}
                                <span className="text-muted-foreground font-normal">
                                    (leave blank to generate from title)
                                </span>
                            </Label>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                placeholder="auto"
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                            />
                            <InputError message={form.errors.slug} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                rows={5}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData('status', value)
                                }
                            >
                                <SelectTrigger id="status" className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem
                                            key={status}
                                            value={status}
                                            className="capitalize"
                                        >
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Variants</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addVariant}
                        >
                            Add variant
                        </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {form.data.variants.map((variant, index) => (
                            <div
                                key={variant.id ?? `new-${index}`}
                                className="border-border grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
                            >
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={variant.name}
                                        onChange={(e) =>
                                            updateVariant(
                                                index,
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[`variants.${index}.name`]
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>SKU</Label>
                                    <Input
                                        value={variant.sku}
                                        onChange={(e) =>
                                            updateVariant(
                                                index,
                                                'sku',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[`variants.${index}.sku`]
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variant.price}
                                        onChange={(e) =>
                                            updateVariant(
                                                index,
                                                'price',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[`variants.${index}.price`]
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Compare-at price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variant.compare_at_price}
                                        onChange={(e) =>
                                            updateVariant(
                                                index,
                                                'compare_at_price',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `variants.${index}.compare_at_price`
                                            ]
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Stock</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={variant.stock_quantity}
                                        onChange={(e) =>
                                            updateVariant(
                                                index,
                                                'stock_quantity',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `variants.${index}.stock_quantity`
                                            ]
                                        }
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={
                                            form.data.variants.length === 1
                                        }
                                        onClick={() => removeVariant(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <InputError message={form.errors.variants} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEdit ? (
                            <ProductImageManager
                                productId={product.id}
                                images={product.images}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Save the product first to add images.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {categories.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No categories yet.
                            </p>
                        ) : (
                            categories.map((category) => (
                                <label
                                    key={category.id}
                                    className="flex items-center gap-2 text-sm"
                                    style={{
                                        paddingLeft: `${categoryDepth(categories, category) * 20}px`,
                                    }}
                                >
                                    <Checkbox
                                        checked={form.data.category_ids.includes(
                                            category.id,
                                        )}
                                        onCheckedChange={(checked) =>
                                            toggleCategory(
                                                category.id,
                                                checked === true,
                                            )
                                        }
                                    />
                                    {category.name}
                                </label>
                            ))
                        )}
                        <InputError message={form.errors.category_ids} />
                    </CardContent>
                </Card>
            </form>
        </>
    );
}

ProductForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: productRoutes.index() },
    ],
};
