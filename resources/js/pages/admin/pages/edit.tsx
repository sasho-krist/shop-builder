import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, useForm } from '@inertiajs/react';
import { ChevronLeft, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ColumnsEditor from '@/components/columns-editor';
import PageCanvas from '@/components/page-canvas';
import SectionFields from '@/components/section-fields';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    type Block,
    findBlock,
    layoutCols,
    mapBlock,
    newBlock,
    type PreviewContext,
    type PropValue,
    resizeColumns,
} from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import type { ThemeTokens } from '@/lib/theme';
import { dashboard } from '@/routes';
import pageRoutes from '@/routes/pages';
import { getSection, SECTION_GROUPS, SECTIONS } from '@/sections/registry';

type PageData = {
    id: number;
    type: string;
    title: string;
    slug: string;
    blocks: Block[];
    seo_title: string | null;
    seo_description: string | null;
    is_published: boolean;
};

type Props = {
    page: PageData;
    context: PreviewContext;
    theme: ThemeTokens;
};

function SortableRow({
    block,
    selected,
    onSelect,
    onDelete,
}: {
    block: Block;
    selected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    const { t } = useT();
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: block.id });
    const section = getSection(block.type);

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`bg-background flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm ${
                selected ? 'border-primary' : 'border-border'
            }`}
        >
            <button
                type="button"
                className="text-muted-foreground cursor-grab touch-none"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>
            <button
                type="button"
                className="flex-1 truncate text-left"
                onClick={onSelect}
            >
                {section ? t(section.label) : block.type}
                {block.columns && (
                    <span className="text-muted-foreground">
                        {' '}
                        · {block.columns.reduce((n, col) => n + col.length, 0)}
                    </span>
                )}
            </button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-7"
                onClick={onDelete}
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function initialSelection(blocks: Block[]): string | null {
    if (typeof window !== 'undefined') {
        const requested = new URLSearchParams(window.location.search).get(
            'section',
        );
        if (requested && findBlock(blocks, requested)) {
            return requested;
        }
    }
    return blocks[0]?.id ?? null;
}

/** The container block that holds `childId` in one of its columns, if any. */
function findParent(blocks: Block[], childId: string): Block | undefined {
    for (const block of blocks) {
        for (const col of block.columns ?? []) {
            if (col.some((c) => c.id === childId)) return block;
            const deeper = findParent(col, childId);
            if (deeper) return deeper;
        }
    }
    return undefined;
}

export default function PageEdit({ page, context, theme }: Props) {
    const { t } = useT();
    const [selectedId, setSelectedId] = useState<string | null>(() =>
        initialSelection(page.blocks),
    );
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    const form = useForm<{
        title: string;
        slug: string;
        blocks: Block[];
        seo_title: string;
        seo_description: string;
        is_published: boolean;
    }>({
        title: page.title,
        slug: page.slug,
        blocks: page.blocks,
        seo_title: page.seo_title ?? '',
        seo_description: page.seo_description ?? '',
        is_published: page.is_published,
    });

    const selected = selectedId
        ? findBlock(form.data.blocks, selectedId)
        : undefined;
    const selectedSection = selected ? getSection(selected.type) : undefined;
    const parentContainer = selectedId
        ? findParent(form.data.blocks, selectedId)
        : undefined;
    const errors = form.errors as Record<string, string>;

    function setBlocks(blocks: Block[]) {
        form.setData('blocks', blocks);
    }

    function addSection(type: string) {
        const section = getSection(type);
        if (!section) return;
        const block = newBlock(section);
        setBlocks([...form.data.blocks, block]);
        setSelectedId(block.id);
    }

    function updateProps(key: string, value: PropValue) {
        if (!selectedId) return;
        setBlocks(
            mapBlock(form.data.blocks, selectedId, (block) => {
                const props = { ...block.props, [key]: value };
                // Changing a container's layout resizes its column child-lists.
                if (getSection(block.type)?.container && key === 'layout') {
                    const layout = typeof value === 'string' ? value : '1-1';
                    return {
                        ...block,
                        props,
                        columns: resizeColumns(
                            block.columns ?? [],
                            layoutCols(layout).length,
                        ),
                    };
                }
                return { ...block, props };
            }),
        );
    }

    function replaceBlock(next: Block) {
        setBlocks(mapBlock(form.data.blocks, next.id, () => next));
    }

    function removeBlock(id: string) {
        setBlocks(mapBlock(form.data.blocks, id, () => null));
        if (selectedId === id || findParent(form.data.blocks, id)?.id === id) {
            setSelectedId(null);
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = form.data.blocks.findIndex((b) => b.id === active.id);
        const newIndex = form.data.blocks.findIndex((b) => b.id === over.id);
        setBlocks(arrayMove(form.data.blocks, oldIndex, newIndex));
    }

    function save(event: React.FormEvent) {
        event.preventDefault();
        form.put(pageRoutes.update(page.id).url, { preserveScroll: true });
    }

    return (
        <>
            <Head title={t(':title — page', { title: page.title })} />

            <form onSubmit={save} className="flex h-full flex-1 flex-col">
                <div className="border-border flex items-center gap-3 border-b p-4">
                    <Input
                        value={form.data.title}
                        className="max-w-xs font-medium"
                        onChange={(e) => form.setData('title', e.target.value)}
                    />
                    <label className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.is_published}
                            onCheckedChange={(checked) =>
                                form.setData('is_published', checked === true)
                            }
                        />
                        {t('Published')}
                    </label>
                    <Button
                        type="submit"
                        className="ml-auto"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        {t('Save')}
                    </Button>
                </div>

                <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,340px)_1fr]">
                    <div className="border-border flex flex-col gap-4 overflow-y-auto border-r p-4">
                        {page.type === 'page' && (
                            <div className="grid gap-1.5">
                                <Label className="text-xs">
                                    {t('URL slug')}
                                </Label>
                                <Input
                                    value={form.data.slug}
                                    onChange={(e) =>
                                        form.setData('slug', e.target.value)
                                    }
                                />
                                {errors.slug && (
                                    <span className="text-destructive text-xs">
                                        {errors.slug}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold">
                                    {t('Sections')}
                                </h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Plus className="size-4" />
                                            {t('Add')}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="max-h-[70vh] overflow-y-auto"
                                    >
                                        {SECTION_GROUPS.map((group, gi) => {
                                            const inGroup = SECTIONS.filter(
                                                (s) => s.group === group,
                                            );
                                            if (inGroup.length === 0)
                                                return null;
                                            return (
                                                <div key={group}>
                                                    {gi > 0 && (
                                                        <DropdownMenuSeparator />
                                                    )}
                                                    <DropdownMenuLabel className="text-muted-foreground text-[11px] tracking-wide uppercase">
                                                        {t(group)}
                                                    </DropdownMenuLabel>
                                                    {inGroup.map((section) => (
                                                        <DropdownMenuItem
                                                            key={section.type}
                                                            onClick={() =>
                                                                addSection(
                                                                    section.type,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex flex-col">
                                                                <span>
                                                                    {t(
                                                                        section.label,
                                                                    )}
                                                                </span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    {t(
                                                                        section.description,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                                <SortableContext
                                    items={form.data.blocks.map((b) => b.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex flex-col gap-1.5">
                                        {form.data.blocks.map((block) => (
                                            <SortableRow
                                                key={block.id}
                                                block={block}
                                                selected={
                                                    block.id === selectedId
                                                }
                                                onSelect={() =>
                                                    setSelectedId(block.id)
                                                }
                                                onDelete={() =>
                                                    removeBlock(block.id)
                                                }
                                            />
                                        ))}
                                        {form.data.blocks.length === 0 && (
                                            <p className="text-muted-foreground py-4 text-center text-xs">
                                                {t('No sections yet.')}
                                            </p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {selected && selectedSection && (
                            <div className="border-border flex flex-col gap-3 border-t pt-4">
                                {parentContainer && (
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground -mt-1 flex items-center gap-1 self-start text-xs"
                                        onClick={() =>
                                            setSelectedId(parentContainer.id)
                                        }
                                    >
                                        <ChevronLeft className="size-3.5" />
                                        {t('Back to Columns')}
                                    </button>
                                )}
                                <h2 className="text-sm font-semibold">
                                    {t(':section settings', {
                                        section: t(selectedSection.label),
                                    })}
                                </h2>
                                <SectionFields
                                    fields={selectedSection.fields}
                                    values={selected.props}
                                    ctx={context}
                                    onChange={updateProps}
                                />
                                {selectedSection.container && (
                                    <ColumnsEditor
                                        block={selected}
                                        selectedId={selectedId}
                                        onChange={replaceBlock}
                                        onSelect={setSelectedId}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-900">
                        {page.type === 'thankyou' && (
                            <div className="border-border text-muted-foreground mb-2 rounded-lg border border-dashed p-6 text-center text-xs">
                                {t(
                                    'The order summary renders above your sections on the confirmation page.',
                                )}
                            </div>
                        )}
                        <PageCanvas
                            blocks={form.data.blocks}
                            theme={theme}
                            ctx={context}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                        {page.type === 'shop' && (
                            <div className="border-border text-muted-foreground mt-2 rounded-lg border border-dashed p-6 text-center text-xs">
                                {t(
                                    'The product grid and pagination render here, below your sections.',
                                )}
                            </div>
                        )}
                        {page.type === 'cart' && (
                            <div className="border-border text-muted-foreground mt-2 rounded-lg border border-dashed p-6 text-center text-xs">
                                {t(
                                    'The cart items and totals render here, below your sections.',
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </>
    );
}

PageEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pages', href: pageRoutes.index() },
    ],
};
