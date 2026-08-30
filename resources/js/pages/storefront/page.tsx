import { Head } from '@inertiajs/react';
import StorefrontBlocks from '@/components/storefront-blocks';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { Block, PreviewContext } from '@/lib/blocks';

type Props = {
    title: string;
    blocks: Block[];
    sections: Omit<PreviewContext, 'hrefBase'>;
};

export default function StorefrontPage({ title, blocks, sections }: Props) {
    return (
        <StorefrontLayout>
            <Head title={title} />

            <StorefrontBlocks
                blocks={blocks}
                sections={sections}
                editBase={null}
            />
        </StorefrontLayout>
    );
}
