import type { CSSProperties } from 'react';
import {
    COLUMN_LAYOUTS,
    layoutCols,
    prop,
    type SectionDef,
} from '@/lib/blocks';
import { SectionShell } from './shared';

const GAP: Record<string, string> = {
    none: '0px',
    sm: '0.75rem',
    md: '1.5rem',
    lg: '2.5rem',
};

const VALIGN: Record<string, string> = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
    stretch: 'stretch',
};

export const LAYOUT_SECTIONS: SectionDef[] = [
    {
        type: 'columns',
        group: 'Layout',
        label: 'Columns',
        description: 'A container split into columns of elements',
        container: true,
        fields: [
            {
                type: 'select',
                key: 'layout',
                label: 'Layout',
                options: COLUMN_LAYOUTS.map((l) => ({
                    value: l.value,
                    label: l.label,
                })),
                default: '1-1',
            },
            {
                type: 'select',
                key: 'gap',
                label: 'Gap',
                options: [
                    { value: 'none', label: 'None' },
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                ],
                default: 'md',
            },
            {
                type: 'select',
                key: 'valign',
                label: 'Vertical align',
                options: [
                    { value: 'top', label: 'Top' },
                    { value: 'center', label: 'Center' },
                    { value: 'bottom', label: 'Bottom' },
                    { value: 'stretch', label: 'Stretch' },
                ],
                default: 'top',
            },
            {
                type: 'boolean',
                key: 'stackOnMobile',
                label: 'Stack columns on mobile',
                default: true,
            },
        ],
        Render: ({ props, columns = [] }) => {
            const tracks = layoutCols(String(prop(props, 'layout', '1-1')));
            const gap = GAP[String(prop(props, 'gap', 'md'))] ?? GAP.md;
            const valign =
                VALIGN[String(prop(props, 'valign', 'top'))] ?? VALIGN.top;
            const stack = Boolean(prop(props, 'stackOnMobile', true));

            return (
                <SectionShell>
                    <div
                        className={
                            stack
                                ? 'grid grid-cols-1 sm:[grid-template-columns:var(--sb-tracks)]'
                                : 'grid [grid-template-columns:var(--sb-tracks)]'
                        }
                        style={
                            {
                                '--sb-tracks': tracks.join(' '),
                                gap,
                                alignItems: valign,
                            } as CSSProperties
                        }
                    >
                        {tracks.map((_, i) => (
                            <div
                                key={i}
                                className="flex min-w-0 flex-col gap-4"
                            >
                                {columns[i] ?? null}
                            </div>
                        ))}
                    </div>
                </SectionShell>
            );
        },
    },
];
