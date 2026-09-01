import type { Block, PreviewContext } from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import { type ThemeTokens, themeToCssVars } from '@/lib/theme';
import { getSection } from '@/sections/registry';
import { NestedContext } from '@/sections/shared';

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
    const { t } = useT();

    function renderBlock(block: Block, nested = false) {
        const section = getSection(block.type);
        if (!section) return null;

        const selected = selectedId === block.id;

        const columns = block.columns?.map((col, i) => (
            <NestedContext.Provider key={i} value={true}>
                {col.length === 0 ? (
                    <div className="text-muted-foreground border-muted-foreground/30 rounded border border-dashed p-4 text-center text-xs">
                        {t('Empty column')}
                    </div>
                ) : (
                    col.map((child) => renderBlock(child, true))
                )}
            </NestedContext.Provider>
        ));

        return (
            <div
                key={block.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(block.id);
                }}
                className={`relative cursor-pointer transition-shadow ${
                    nested ? 'rounded' : ''
                } ${
                    selected
                        ? 'ring-primary ring-2 ring-inset'
                        : 'hover:ring-primary/30 hover:ring-1 hover:ring-inset'
                }`}
            >
                <section.Render
                    props={block.props}
                    ctx={ctx}
                    columns={columns}
                />
            </div>
        );
    }

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
                    {t('Add a section to start building this page.')}
                </div>
            )}
            {blocks.map((block) => renderBlock(block))}
        </div>
    );
}
