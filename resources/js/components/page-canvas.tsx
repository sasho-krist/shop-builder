import type { Block, PreviewContext } from '@/lib/blocks';
import { type ThemeTokens, themeToCssVars } from '@/lib/theme';
import { getSection } from '@/sections/registry';

type Props = {
    blocks: Block[];
    theme: ThemeTokens;
    ctx: PreviewContext;
    selectedId?: string | null;
    onSelect?: (id: string) => void;
};

export default function PageCanvas({
    blocks,
    theme,
    ctx,
    selectedId,
    onSelect,
}: Props) {
    return (
        <div
            style={{
                ...themeToCssVars(theme),
                background: 'var(--sb-background)',
                color: 'var(--sb-foreground)',
                fontFamily: 'var(--sb-body-font)',
                fontSize: 'var(--sb-base-size)',
            }}
            className="overflow-hidden rounded-xl border"
        >
            {blocks.length === 0 && (
                <div className="text-muted-foreground p-16 text-center text-sm">
                    Add a section to start building this page.
                </div>
            )}
            {blocks.map((block) => {
                const section = getSection(block.type);
                if (!section) return null;

                const selected = selectedId === block.id;

                return (
                    <div
                        key={block.id}
                        onClick={() => onSelect?.(block.id)}
                        className={`relative cursor-pointer transition-shadow ${
                            selected
                                ? 'ring-primary ring-2 ring-inset'
                                : 'hover:ring-primary/30 hover:ring-1 hover:ring-inset'
                        }`}
                    >
                        <section.Render props={block.props} ctx={ctx} />
                    </div>
                );
            })}
        </div>
    );
}
