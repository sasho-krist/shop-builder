import type { FC } from 'react';

/** A row inside a `repeater` field. */
export type RepeaterItem = Record<string, string | number | boolean>;

export type PropValue = string | number | boolean | null | RepeaterItem[];

export type Block = {
    id: string;
    type: string;
    props: Record<string, PropValue>;
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

export type PreviewContext = {
    products: PreviewProduct[];
    bestSelling: PreviewProduct[];
    collections: PreviewCollection[];
    /** When set, product cards link to `${hrefBase}${slug}` (storefront only). */
    hrefBase?: string;
};

export type SectionDef = {
    type: string;
    /** Grouping shown in the "Add section" menu. */
    group: 'Store' | 'Basic' | 'Media' | 'Content' | 'Advanced';
    label: string;
    description: string;
    fields: FieldDef[];
    Render: FC<{ props: Record<string, PropValue>; ctx: PreviewContext }>;
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

export function newBlock(section: SectionDef): Block {
    return {
        id:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: section.type,
        props: defaultProps(section.fields),
    };
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
