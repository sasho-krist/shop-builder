import { SquarePen } from 'lucide-react';
import { useOwnerToolsHidden } from '@/hooks/use-owner-tools';
import type { Block, PreviewContext } from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import { getSection } from '@/sections/registry';
import { NestedContext } from '@/sections/shared';

/**
 * Renders a page's saved blocks through the shared section registry, with the
 * per-section "edit" affordance for a signed-in owner (unless tools are hidden).
 * Container blocks (`columns`) render their children recursively.
 */
export default function StorefrontBlocks({
    blocks,
    sections,
    editBase,
    emptyMessage,
    pageSlug,
}: {
    blocks: Block[];
    sections: Omit<PreviewContext, 'hrefBase'>;
    editBase: string | null;
    emptyMessage?: string;
    /** Slug of the page being rendered — sent with form submissions. */
    pageSlug?: string;
}) {
    const [toolsHidden] = useOwnerToolsHidden();
    const { t } = useT();
    const ctx: PreviewContext = {
        ...sections,
        hrefBase: '/p/',
        formAction: '/forms',
        pageSlug,
    };
    const canEdit = !toolsHidden && editBase !== null;

    function renderBlock(block: Block) {
        const section = getSection(block.type);
        if (!section) return null;

        const columns = block.columns?.map((col, i) => (
            <NestedContext.Provider key={i} value={true}>
                {col.map((child) => renderBlock(child))}
            </NestedContext.Provider>
        ));

        return (
            <div key={block.id} className="group/section relative">
                {canEdit && (
                    <a
                        href={`${editBase}?section=${block.id}`}
                        className="absolute top-2 right-2 z-10 hidden items-center gap-1.5 rounded-md bg-neutral-900/90 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover/section:flex group-hover/section:opacity-100"
                    >
                        <SquarePen className="size-3.5" />
                        {t(section.label)}
                    </a>
                )}
                <section.Render
                    props={block.props}
                    ctx={ctx}
                    columns={columns}
                />
            </div>
        );
    }

    if (blocks.length === 0) {
        return (
            <div
                className="mx-auto max-w-lg px-4 py-24 text-center text-sm"
                style={{ color: 'var(--sb-muted-foreground)' }}
            >
                {emptyMessage ?? t('Nothing here yet.')}
            </div>
        );
    }

    return <>{blocks.map((block) => renderBlock(block))}</>;
}
