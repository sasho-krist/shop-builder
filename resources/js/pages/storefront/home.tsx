import { Head, usePage } from '@inertiajs/react';
import StorefrontBlocks from '@/components/storefront-blocks';
import StorefrontLayout, {
    type StorefrontShared,
} from '@/layouts/storefront-layout';
import type { Block, PreviewContext } from '@/lib/blocks';

type Props = {
    blocks: Block[];
    sections: Omit<PreviewContext, 'hrefBase'>;
};

export default function StorefrontHome({ blocks, sections }: Props) {
    const { storefront } = usePage<StorefrontShared>().props;
    const editBase = storefront.manage?.homePage ?? null;

    return (
        <StorefrontLayout
            ownerEdit={
                editBase ? { href: editBase, label: 'Edit home' } : undefined
            }
        >
            <Head title={storefront.storeName} />

            <StorefrontBlocks
                blocks={blocks}
                sections={sections}
                editBase={editBase}
                emptyMessage="This store is just getting started."
            />
        </StorefrontLayout>
    );
}
