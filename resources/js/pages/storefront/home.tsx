import { Head, usePage } from '@inertiajs/react';
import StorefrontLayout, {
    type StorefrontShared,
} from '@/layouts/storefront-layout';
import type { Block, PreviewContext } from '@/lib/blocks';
import { getSection } from '@/sections/registry';

type Props = {
    blocks: Block[];
    sections: Omit<PreviewContext, 'hrefBase'>;
};

export default function StorefrontHome({ blocks, sections }: Props) {
    const { storefront } = usePage<StorefrontShared>().props;
    const ctx: PreviewContext = { ...sections, hrefBase: '/p/' };

    return (
        <StorefrontLayout>
            <Head title={storefront.storeName} />

            {blocks.length === 0 ? (
                <div
                    className="mx-auto max-w-lg px-4 py-24 text-center text-sm"
                    style={{ color: 'var(--sb-muted-foreground)' }}
                >
                    This store is just getting started.
                </div>
            ) : (
                blocks.map((block) => {
                    const section = getSection(block.type);
                    if (!section) return null;
                    return (
                        <section.Render
                            key={block.id}
                            props={block.props}
                            ctx={ctx}
                        />
                    );
                })
            )}
        </StorefrontLayout>
    );
}
