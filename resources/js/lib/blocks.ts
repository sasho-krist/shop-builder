import type { FC, ReactNode } from 'react';

/** A row inside a `repeater` field. */
export type RepeaterItem = Record<string, string | number | boolean>;

export type PropValue = string | number | boolean | null | RepeaterItem[];

export type Block = {
    id: string;
    type: string;
    props: Record<string, PropValue>;
    /** Container blocks only (`type: 'columns'`): one child list per column. */
    columns?: Block[][];
};

/** The field types a repeater row may contain (a flat subset of FieldDef). */
export type RepeaterFieldDef =
    | { type: 'text'; key: string; label: string; default: string }
    | { type: 'textarea'; key: string; label: string; default: string }
    | { type: 'image'; key: string; label: string; default: string }
    | { type: 'color'; key: string; label: string; default: string }
    | { type: 'icon'; key: string; label: string; default: string }
    | { type: 'boolean'; key: string; label: string; default: boolean }
    | {
          type: 'select';
          key: string;
          label: string;
          options: { value: string; label: string }[];
          default: string;
      };

export type FieldDef =
    | { type: 'text'; key: string; label: string; default: string }
    | { type: 'textarea'; key: string; label: string; default: string }
    | { type: 'html'; key: string; label: string; default: string }
    | { type: 'image'; key: string; label: string; default: string }
    | { type: 'color'; key: string; label: string; default: string }
    | { type: 'icon'; key: string; label: string; default: string }
    | {
          type: 'select';
          key: string;
          label: string;
          options: { value: string; label: string }[];
          default: string;
      }
    | {
          type: 'number';
          key: string;
          label: string;
          min: number;
          max: number;
          default: number;
      }
    | { type: 'boolean'; key: string; label: string; default: boolean }
    | {
          type: 'collection';
          key: string;
          label: string;
          default: number | null;
      }
    | {
          type: 'category';
          key: string;
          label: string;
          default: number | null;
      }
    | {
          type: 'repeater';
          key: string;
          label: string;
          itemLabel: string;
          fields: RepeaterFieldDef[];
          max?: number;
          default: RepeaterItem[];
      };

export type PreviewProduct = {
    id: number;
    title: string;
    slug?: string;
    price: string | null;
    image: string | null;
};

export type PreviewCollection = {
    id: number;
    title: string;
    products: PreviewProduct[];
};

/** A category and a sample of its products, for the `category` picker / source. */
export type PreviewCategory = {
    id: number;
    title: string;
    products: PreviewProduct[];
};

export type PreviewContext = {
    products: PreviewProduct[];
    bestSelling: PreviewProduct[];
    collections: PreviewCollection[];
    categories: PreviewCategory[];
    /** When set, product cards link to `${hrefBase}${slug}` (storefront only). */
    hrefBase?: string;
    /** POST endpoint for form sections. Only set on the live storefront; when
     *  absent (editor canvas) forms render but do not submit. */
    formAction?: string;
    /** Slug of the page being rendered, sent with form submissions. */
    pageSlug?: string;
};

export type SectionDef = {
    type: string;
    /** Grouping shown in the "Add section" menu. */
    group: 'Layout' | 'Store' | 'Basic' | 'Media' | 'Content' | 'Advanced';
    label: string;
    description: string;
    /** A `columns`-style block that hosts nested blocks in `block.columns`. */
    container?: boolean;
    fields: FieldDef[];
    Render: FC<{
        props: Record<string, PropValue>;
        ctx: PreviewContext;
        /** Pre-rendered column contents, for container sections. */
        columns?: ReactNode[];
    }>;
};

export function defaultProps(fields: FieldDef[]): Record<string, PropValue> {
    return Object.fromEntries(
        fields.map((field) => [
            field.key,
            field.type === 'repeater'
                ? field.default.map((row) => ({ ...row }))
                : field.default,
        ]),
    );
}

export function genId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function newBlock(section: SectionDef): Block {
    const block: Block = {
        id: genId(),
        type: section.type,
        props: defaultProps(section.fields),
    };
    if (section.container) {
        block.columns = [[], []];
    }
    return block;
}

export function prop<T extends PropValue>(
    props: Record<string, PropValue>,
    key: string,
    fallback: T,
): T {
    const value = props[key];
    return value === undefined || value === null ? fallback : (value as T);
}

/** Reads a repeater field's rows, always returning an array. */
export function rows(
    props: Record<string, PropValue>,
    key: string,
): RepeaterItem[] {
    const value = props[key];
    return Array.isArray(value) ? value : [];
}

export function blankRow(fields: RepeaterFieldDef[]): RepeaterItem {
    return Object.fromEntries(fields.map((f) => [f.key, f.default]));
}

// ── Recursive block-tree helpers (blocks can nest inside container columns) ──

export function findBlock(blocks: Block[], id: string): Block | undefined {
    for (const block of blocks) {
        if (block.id === id) return block;
        for (const col of block.columns ?? []) {
            const hit = findBlock(col, id);
            if (hit) return hit;
        }
    }
    return undefined;
}

/** Immutably replace the block with `id`, or drop it when `fn` returns null. */
export function mapBlock(
    blocks: Block[],
    id: string,
    fn: (block: Block) => Block | null,
): Block[] {
    return blocks.flatMap((block) => {
        if (block.id === id) {
            const next = fn(block);
            return next ? [next] : [];
        }
        if (block.columns) {
            return [
                {
                    ...block,
                    columns: block.columns.map((col) => mapBlock(col, id, fn)),
                },
            ];
        }
        return [block];
    });
}

/** Every block type used anywhere in the tree. */
export function allTypes(blocks: Block[]): string[] {
    return blocks.flatMap((b) => [
        b.type,
        ...(b.columns ?? []).flatMap((col) => allTypes(col)),
    ]);
}

export const COLUMN_LAYOUTS: {
    value: string;
    label: string;
    cols: string[];
}[] = [
    { value: '1-1', label: '2 equal', cols: ['1fr', '1fr'] },
    { value: '1-1-1', label: '3 equal', cols: ['1fr', '1fr', '1fr'] },
    { value: '1-1-1-1', label: '4 equal', cols: ['1fr', '1fr', '1fr', '1fr'] },
    { value: '1-2', label: '1 : 2', cols: ['1fr', '2fr'] },
    { value: '2-1', label: '2 : 1', cols: ['2fr', '1fr'] },
    { value: '1-3', label: '1 : 3', cols: ['1fr', '3fr'] },
    { value: '3-1', label: '3 : 1', cols: ['3fr', '1fr'] },
];

export function layoutCols(value: string): string[] {
    return (
        COLUMN_LAYOUTS.find((l) => l.value === value)?.cols ?? ['1fr', '1fr']
    );
}

/** Resize a container's column child-lists to match a new layout. */
export function resizeColumns(current: Block[][], count: number): Block[][] {
    const next = current.slice(0, count);
    while (next.length < count) next.push([]);
    // fold any dropped columns' children into the last kept column
    if (current.length > count) {
        const spill = current.slice(count).flat();
        next[count - 1] = [...next[count - 1], ...spill];
    }
    return next;
}
