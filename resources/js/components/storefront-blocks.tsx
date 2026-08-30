import { SquarePen } from 'lucide-react';
import { useOwnerToolsHidden } from '@/hooks/use-owner-tools';
import type { Block, PreviewContext } from '@/lib/blocks';
import { getSection } from '@/sections/registry';

/**
 * Renders a page's saved blocks through the shared section registry, with the
 * per-section "edit" affordance for a signed-in owner (unless tools are hidden).
 */
export default function StorefrontBlocks({
    blocks,
    sections,
    editBase,
    emptyMessage = 'Nothing here yet.',
}: {
    blocks: Block[];
    sections: Omit<PreviewContext, 'hrefBase'>;
    editBase: string | null;
    emptyMessage?: string;
}) {
    const [toolsHidden] = useOwnerToolsHidden();
    const ctx: PreviewContext = { ...sections, hrefBase: '/p/' };
    const canEdit = !toolsHidden && editBase !== null;

    if (blocks.length === 0) {
        return (
            <div
                className="mx-auto max-w-lg px-4 py-24 text-center text-sm"
                style={{ color: 'var(--sb-muted-foreground)' }}
            >
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {blocks.map((block) => {
                const section = getSection(block.type);
                if (!section) return null;

                return (
                    <div key={block.id} className="group/section relative">
                        {canEdit && (
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
            })}
        </>
    );
}
