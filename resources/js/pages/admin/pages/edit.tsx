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
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import PageCanvas from '@/components/page-canvas';
import SectionFields from '@/components/section-fields';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    type Block,
    newBlock,
    type PreviewContext,
    type PropValue,
} from '@/lib/blocks';
import type { ThemeTokens } from '@/lib/theme';
import { dashboard } from '@/routes';
import pageRoutes from '@/routes/pages';
import { getSection, SECTIONS } from '@/sections/registry';

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
                {section?.label ?? block.type}
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

export default function PageEdit({ page, context, theme }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(
        page.blocks[0]?.id ?? null,
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

    const selected = form.data.blocks.find((block) => block.id === selectedId);
    const selectedSection = selected ? getSection(selected.type) : undefined;
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
        setBlocks(
            form.data.blocks.map((block) =>
                block.id === selectedId
                    ? { ...block, props: { ...block.props, [key]: value } }
                    : block,
            ),
        );
    }

    function removeBlock(id: string) {
        setBlocks(form.data.blocks.filter((block) => block.id !== id));
        if (selectedId === id) setSelectedId(null);
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
            <Head title={`${page.title} — page`} />

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
                        Published
                    </label>
                    <Button
                        type="submit"
                        className="ml-auto"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Save
                    </Button>
                </div>

                <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,340px)_1fr]">
                    <div className="border-border flex flex-col gap-4 overflow-y-auto border-r p-4">
                        {page.type !== 'home' && (
                            <div className="grid gap-1.5">
                                <Label className="text-xs">URL slug</Label>
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
                                    Sections
                                </h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Plus className="size-4" />
                                            Add
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {SECTIONS.map((section) => (
                                            <DropdownMenuItem
                                                key={section.type}
                                                onClick={() =>
                                                    addSection(section.type)
                                                }
                                            >
                                                <div className="flex flex-col">
                                                    <span>{section.label}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {section.description}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
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
                                                No sections yet.
                                            </p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {selected && selectedSection && (
                            <div className="border-border flex flex-col gap-3 border-t pt-4">
                                <h2 className="text-sm font-semibold">
                                    {selectedSection.label} settings
                                </h2>
                                <SectionFields
                                    fields={selectedSection.fields}
                                    values={selected.props}
                                    ctx={context}
                                    onChange={updateProps}
                                />
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-900">
                        <PageCanvas
                            blocks={form.data.blocks}
                            theme={theme}
                            ctx={context}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
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
