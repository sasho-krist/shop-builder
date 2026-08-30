import { Head, usePage } from '@inertiajs/react';
import { SquarePen } from 'lucide-react';
import { useOwnerToolsHidden } from '@/hooks/use-owner-tools';
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
    const [toolsHidden] = useOwnerToolsHidden();
    const editBase =
        !toolsHidden && storefront.manage ? storefront.manage.homePage : null;

    return (
        <StorefrontLayout
            ownerEdit={
                editBase ? { href: editBase, label: 'Edit home' } : undefined
            }
        >
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
                        <div key={block.id} className="group/section relative">
                            {editBase && (
                                <a
                                    href={`${editBase}?section=${block.id}`}
                                    className="absolute top-2 right-2 z-10 hidden items-center gap-1.5 rounded-md bg-neutral-900/90 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover/section:flex group-hover/section:opacity-100"
                                >
                                    <SquarePen className="size-3.5" />
                                    {section.label}
                                </a>
                            )}
                            <section.Render props={block.props} ctx={ctx} />
                        </div>
                    );
                })
            )}
        </StorefrontLayout>
    );
}
