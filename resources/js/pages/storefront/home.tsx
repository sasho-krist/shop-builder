import { Head, usePage } from '@inertiajs/react';
import StorefrontBlocks from '@/components/storefront-blocks';
import { useT } from '@/lib/i18n';
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
    const { t } = useT();
    const editBase = storefront.manage?.homePage ?? null;

    return (
        <StorefrontLayout
            ownerEdit={
                editBase ? { href: editBase, label: t('Edit home') } : undefined
            }
        >
            <Head title={storefront.storeName} />

            <StorefrontBlocks
                blocks={blocks}
                sections={sections}
                editBase={editBase}
                emptyMessage={t('This store is just getting started.')}
            />
        </StorefrontLayout>
    );
}
