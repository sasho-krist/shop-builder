import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n';
import productImageRoutes from '@/routes/products/images';

export type ProductImage = {
    id: number;
    url: string;
    alt: string | null;
};

type Props = {
    productId: number;
    images: ProductImage[];
};

export default function ProductImageManager({ productId, images }: Props) {
    const { t } = useT();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    function upload(files: FileList | null) {
        if (!files || files.length === 0) {
            return;
        }
        setUploading(true);
        router.post(
            productImageRoutes.store(productId).url,
            { images: Array.from(files) },
            {
                preserveScroll: true,
                forceFormData: true,
                onFinish: () => {
                    setUploading(false);
                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                },
            },
        );
    }

    function remove(imageId: number) {
        router.delete(
            productImageRoutes.destroy({ product: productId, image: imageId })
                .url,
            { preserveScroll: true },
        );
    }

    function saveAlt(imageId: number, alt: string) {
        router.patch(
            productImageRoutes.update({ product: productId, image: imageId })
                .url,
            { alt },
            { preserveScroll: true },
        );
    }

    function move(index: number, direction: -1 | 1) {
        const next = [...images];
        const target = index + direction;
        if (target < 0 || target >= next.length) {
            return;
        }
        [next[index], next[target]] = [next[target], next[index]];
        router.put(
            productImageRoutes.reorder(productId).url,
            { ids: next.map((image) => image.id) },
            { preserveScroll: true },
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    upload(event.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm transition-colors ${
                    dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                }`}
            >
                {uploading ? (
                    <Loader2 className="text-muted-foreground size-6 animate-spin" />
                ) : (
                    <ImagePlus className="text-muted-foreground size-6" />
                )}
                <span className="text-muted-foreground">
                    {t('Drop images here or click to upload')}
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => upload(event.target.files)}
                />
            </div>

            {images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className="border-border animate-in fade-in flex gap-3 rounded-lg border p-2 duration-200"
                        >
                            <img
                                src={image.url}
                                alt={image.alt ?? ''}
                                className="bg-muted size-20 shrink-0 rounded-md object-cover"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <Input
                                    defaultValue={image.alt ?? ''}
                                    placeholder={t('Alt text')}
                                    className="h-8"
                                    onBlur={(event) => {
                                        if (
                                            event.target.value !==
                                            (image.alt ?? '')
                                        ) {
                                            saveAlt(
                                                image.id,
                                                event.target.value,
                                            );
                                        }
                                    }}
                                />
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                    >
                                        <ArrowUp className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        disabled={index === images.length - 1}
                                        onClick={() => move(index, 1)}
                                    >
                                        <ArrowDown className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive ml-auto size-7"
                                        onClick={() => remove(image.id)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
