import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Block, layoutCols, newBlock, prop } from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import { getSection, SECTION_GROUPS, SECTIONS } from '@/sections/registry';

/** Sections that can be dropped inside a column (everything but containers). */
const ADDABLE = SECTIONS.filter((s) => !s.container);

export default function ColumnsEditor({
    block,
    selectedId,
    onChange,
    onSelect,
}: {
    block: Block;
    selectedId: string | null;
    onChange: (block: Block) => void;
    onSelect: (id: string) => void;
}) {
    const { t } = useT();
    const layout = String(prop(block.props, 'layout', '1-1'));
    const count = layoutCols(layout).length;
    const columns = block.columns ?? [];

    function setColumn(index: number, next: Block[]) {
        const cols = Array.from({ length: count }, (_, i) =>
            i === index ? next : (columns[i] ?? []),
        );
        onChange({ ...block, columns: cols });
    }

    function move(colIndex: number, from: number, dir: -1 | 1) {
        const col = columns[colIndex] ?? [];
        const to = from + dir;
        if (to < 0 || to >= col.length) return;
        const copy = [...col];
        [copy[from], copy[to]] = [copy[to], copy[from]];
        setColumn(colIndex, copy);
    }

    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: count }, (_, colIndex) => {
                const col = columns[colIndex] ?? [];
                return (
                    <div
                        key={colIndex}
                        className="border-border rounded-md border p-2"
                    >
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">
                                {t('Column :n', { n: colIndex + 1 })}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                    >
                                        <Plus className="size-3.5" />
                                        {t('Add')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="max-h-[60vh] overflow-y-auto"
                                >
                                    {SECTION_GROUPS.map((group, gi) => {
                                        const inGroup = ADDABLE.filter(
                                            (s) => s.group === group,
                                        );
                                        if (inGroup.length === 0) return null;
                                        return (
                                            <div key={group}>
                                                {gi > 0 && (
                                                    <DropdownMenuSeparator />
                                                )}
                                                <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase">
                                                    {t(group)}
                                                </DropdownMenuLabel>
                                                {inGroup.map((section) => (
                                                    <DropdownMenuItem
                                                        key={section.type}
                                                        onClick={() => {
                                                            const b =
                                                                newBlock(
                                                                    section,
                                                                );
                                                            setColumn(
                                                                colIndex,
                                                                [...col, b],
                                                            );
                                                            onSelect(b.id);
                                                        }}
                                                    >
                                                        {t(section.label)}
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {col.length === 0 ? (
                            <p className="text-muted-foreground py-3 text-center text-xs">
                                {t('Empty column')}
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {col.map((child, i) => {
                                    const s = getSection(child.type);
                                    return (
                                        <div
                                            key={child.id}
                                            className={`bg-background flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                                                child.id === selectedId
                                                    ? 'border-primary'
                                                    : 'border-border'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                className="flex-1 truncate text-left"
                                                onClick={() =>
                                                    onSelect(child.id)
                                                }
                                            >
                                                {s ? t(s.label) : child.type}
                                            </button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-6"
                                                disabled={i === 0}
                                                onClick={() =>
                                                    move(colIndex, i, -1)
                                                }
                                            >
                                                <ArrowUp className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-6"
                                                disabled={i === col.length - 1}
                                                onClick={() =>
                                                    move(colIndex, i, 1)
                                                }
                                            >
                                                <ArrowDown className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground size-6"
                                                onClick={() =>
                                                    setColumn(
                                                        colIndex,
                                                        col.filter(
                                                            (_, idx) =>
                                                                idx !== i,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
