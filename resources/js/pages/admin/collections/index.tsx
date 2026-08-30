import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import collections from '@/routes/collections';

type CollectionRow = {
    id: number;
    title: string;
    slug: string;
    is_visible: boolean;
    products_count: number;
};

type Props = {
    collections: CollectionRow[];
};

export default function CollectionsIndex({ collections: rows }: Props) {
    const { t } = useT();

    function destroy(collection: CollectionRow) {
        if (confirm(t('Delete ":title"?', { title: collection.title }))) {
            router.delete(collections.destroy(collection.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title={t('Collections')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            {t('Collections')}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {rows.length === 1
                                ? t(':count collection', { count: rows.length })
                                : t(':count collections', {
                                      count: rows.length,
                                  })}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={collections.create().url}>
                            {t('New collection')}
                        </Link>
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        {t(
                            'No collections yet. Group products into collections to feature them on your storefront.',
                        )}
                    </div>
                ) : (
                    <div className="border-border divide-border divide-y rounded-xl border">
                        {rows.map((collection) => (
                            <div
                                key={collection.id}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <Link
                                    href={collections.edit(collection.id).url}
                                    className="font-medium hover:underline"
                                >
                                    {collection.title}
                                </Link>
                                {!collection.is_visible && (
                                    <Badge variant="outline">
                                        {t('Hidden')}
                                    </Badge>
                                )}
                                <Badge variant="secondary">
                                    {t(':count products', {
                                        count: collection.products_count,
                                    })}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto"
                                    onClick={() => destroy(collection)}
                                >
                                    {t('Delete')}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

CollectionsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Collections', href: collections.index() },
    ],
};
