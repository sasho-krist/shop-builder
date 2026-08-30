import type { FC } from 'react';

export type PropValue = string | number | boolean | null;

export type Block = {
    id: string;
    type: string;
    props: Record<string, PropValue>;
};

export type FieldDef =
    | { type: 'text'; key: string; label: string; default: string }
    | { type: 'textarea'; key: string; label: string; default: string }
    | { type: 'image'; key: string; label: string; default: string }
    | { type: 'color'; key: string; label: string; default: string }
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
    label: string;
    description: string;
    fields: FieldDef[];
    Render: FC<{ props: Record<string, PropValue>; ctx: PreviewContext }>;
};

export function defaultProps(fields: FieldDef[]): Record<string, PropValue> {
    return Object.fromEntries(
        fields.map((field) => [field.key, field.default]),
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
