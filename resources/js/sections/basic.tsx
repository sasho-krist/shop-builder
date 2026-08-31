import type { CSSProperties } from 'react';
import { prop, type SectionDef } from '@/lib/blocks';
import { IconGlyph } from './icons';
import {
    ALIGN_OPTIONS,
    alignItems,
    Btn,
    embedUrl,
    SectionShell,
    textAlign,
} from './shared';

const TAG_OPTIONS = [
    { value: 'h1', label: 'H1' },
    { value: 'h2', label: 'H2' },
    { value: 'h3', label: 'H3' },
    { value: 'h4', label: 'H4' },
    { value: 'p', label: 'Paragraph' },
];

const HEADING_SIZE: Record<string, string> = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    p: 'text-base',
};

export const BASIC_SECTIONS: SectionDef[] = [
    {
        type: 'heading',
        group: 'Basic',
        label: 'Heading',
        description: 'A single title',
        fields: [
            {
                type: 'text',
                key: 'text',
                label: 'Text',
                default: 'Add your heading here',
            },
            {
                type: 'select',
                key: 'tag',
                label: 'Tag',
                options: TAG_OPTIONS,
                default: 'h2',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'left',
            },
            { type: 'color', key: 'color', label: 'Colour', default: '' },
        ],
        Render: ({ props }) => {
            const tag = String(prop(props, 'tag', 'h2'));
            const Tag = (tag === 'p' ? 'p' : tag) as 'h1';
            const color = String(prop(props, 'color', ''));
            return (
                <SectionShell
                    style={textAlign(String(prop(props, 'align', 'left')))}
                >
                    <Tag
                        style={{
                            fontFamily: 'var(--sb-heading-font)',
                            color: color || undefined,
                        }}
                        className={HEADING_SIZE[tag] ?? HEADING_SIZE.h2}
                    >
                        {prop(props, 'text', '')}
                    </Tag>
                </SectionShell>
            );
        },
    },
    {
        type: 'textEditor',
        group: 'Basic',
        label: 'Text editor',
        description: 'A rich paragraph (HTML allowed)',
        fields: [
            {
                type: 'html',
                key: 'content',
                label: 'Content',
                default:
                    '<p>Start writing. Basic HTML like <strong>bold</strong>, <em>italic</em> and <a href="#">links</a> works.</p>',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'left',
            },
        ],
        Render: ({ props }) => (
            <SectionShell
                style={textAlign(String(prop(props, 'align', 'left')))}
            >
                <div
                    className="sb-richtext max-w-2xl text-sm leading-relaxed [&_a]:underline [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3"
                    style={{ color: 'var(--sb-foreground)' }}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: String(prop(props, 'content', '')),
                    }}
                />
            </SectionShell>
        ),
    },
    {
        type: 'image',
        group: 'Basic',
        label: 'Image',
        description: 'A single image, optionally linked',
        fields: [
            { type: 'image', key: 'image', label: 'Image', default: '' },
            { type: 'text', key: 'caption', label: 'Caption', default: '' },
            {
                type: 'text',
                key: 'link',
                label: 'Link (optional)',
                default: '',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'center',
            },
            {
                type: 'number',
                key: 'maxWidth',
                label: 'Max width (%)',
                min: 20,
                max: 100,
                default: 100,
            },
        ],
        Render: ({ props }) => {
            const src = String(prop(props, 'image', ''));
            const link = String(prop(props, 'link', ''));
            const align = String(prop(props, 'align', 'center'));
            const img = src ? (
                <img
                    src={src}
                    alt={String(prop(props, 'caption', ''))}
                    style={{
                        maxWidth: `${prop(props, 'maxWidth', 100)}%`,
                        borderRadius: 'var(--sb-radius)',
                    }}
                    className="h-auto"
                />
            ) : (
                <div
                    style={{ background: 'var(--sb-muted)' }}
                    className="aspect-video w-full rounded"
                />
            );
            return (
                <SectionShell
                    className={`flex flex-col gap-2 ${alignItems(align)}`}
                >
                    {link ? <a href={link}>{img}</a> : img}
                    {prop(props, 'caption', '') && (
                        <span
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-xs"
                        >
                            {prop(props, 'caption', '')}
                        </span>
                    )}
                </SectionShell>
            );
        },
    },
    {
        type: 'button',
        group: 'Basic',
        label: 'Button',
        description: 'A call-to-action button',
        fields: [
            {
                type: 'text',
                key: 'label',
                label: 'Label',
                default: 'Click here',
            },
            { type: 'text', key: 'url', label: 'Link', default: '' },
            {
                type: 'select',
                key: 'variant',
                label: 'Style',
                options: [
                    { value: 'solid', label: 'Solid' },
                    { value: 'outline', label: 'Outline' },
                    { value: 'ghost', label: 'Text only' },
                ],
                default: 'solid',
            },
            {
                type: 'select',
                key: 'size',
                label: 'Size',
                options: [
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                ],
                default: 'md',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'left',
            },
        ],
        Render: ({ props }) => (
            <SectionShell
                className={`flex ${alignItems(String(prop(props, 'align', 'left')))}`}
            >
                <Btn
                    label={String(prop(props, 'label', ''))}
                    url={String(prop(props, 'url', ''))}
                    variant={prop(props, 'variant', 'solid') as 'solid'}
                    size={prop(props, 'size', 'md') as 'md'}
                />
            </SectionShell>
        ),
    },
    {
        type: 'divider',
        group: 'Basic',
        label: 'Divider',
        description: 'A horizontal rule',
        fields: [
            {
                type: 'select',
                key: 'style',
                label: 'Style',
                options: [
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                ],
                default: 'solid',
            },
            {
                type: 'number',
                key: 'width',
                label: 'Width (%)',
                min: 10,
                max: 100,
                default: 100,
            },
            {
                type: 'number',
                key: 'thickness',
                label: 'Thickness (px)',
                min: 1,
                max: 8,
                default: 1,
            },
            { type: 'color', key: 'color', label: 'Colour', default: '' },
        ],
        Render: ({ props }) => (
            <SectionShell py={1} className="flex justify-center">
                <hr
                    style={{
                        width: `${prop(props, 'width', 100)}%`,
                        borderTopWidth: `${prop(props, 'thickness', 1)}px`,
                        borderTopStyle: prop(
                            props,
                            'style',
                            'solid',
                        ) as 'solid',
                        borderColor:
                            String(prop(props, 'color', '')) ||
                            'var(--sb-border)',
                    }}
                />
            </SectionShell>
        ),
    },
    {
        type: 'spacer',
        group: 'Basic',
        label: 'Spacer',
        description: 'Vertical empty space',
        fields: [
            {
                type: 'number',
                key: 'height',
                label: 'Height (px)',
                min: 8,
                max: 200,
                default: 48,
            },
        ],
        Render: ({ props }) => (
            <div style={{ height: `${prop(props, 'height', 48)}px` }} />
        ),
    },
    {
        type: 'iconWidget',
        group: 'Basic',
        label: 'Icon',
        description: 'A single icon',
        fields: [
            { type: 'icon', key: 'icon', label: 'Icon', default: 'star' },
            {
                type: 'number',
                key: 'size',
                label: 'Size (px)',
                min: 16,
                max: 96,
                default: 40,
            },
            { type: 'color', key: 'color', label: 'Colour', default: '' },
            {
                type: 'text',
                key: 'link',
                label: 'Link (optional)',
                default: '',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'center',
            },
        ],
        Render: ({ props }) => {
            const glyph = (
                <IconGlyph
                    name={String(prop(props, 'icon', 'star'))}
                    style={{
                        width: `${prop(props, 'size', 40)}px`,
                        height: `${prop(props, 'size', 40)}px`,
                        color:
                            String(prop(props, 'color', '')) ||
                            'var(--sb-primary)',
                    }}
                />
            );
            const link = String(prop(props, 'link', ''));
            return (
                <SectionShell
                    className={`flex ${alignItems(String(prop(props, 'align', 'center')))}`}
                >
                    {link ? <a href={link}>{glyph}</a> : glyph}
                </SectionShell>
            );
        },
    },
    {
        type: 'blockquote',
        group: 'Basic',
        label: 'Blockquote',
        description: 'A highlighted quotation',
        fields: [
            {
                type: 'textarea',
                key: 'quote',
                label: 'Quote',
                default: 'A short, memorable line worth pulling out.',
            },
            { type: 'text', key: 'author', label: 'Author', default: '' },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'left',
            },
        ],
        Render: ({ props }) => {
            const align = String(prop(props, 'align', 'left'));
            return (
                <SectionShell
                    className={`flex flex-col gap-2 ${alignItems(align)}`}
                >
                    <blockquote
                        style={{
                            borderColor: 'var(--sb-primary)',
                            fontFamily: 'var(--sb-heading-font)',
                        }}
                        className="max-w-2xl border-l-4 pl-4 text-xl font-medium italic"
                    >
                        “{prop(props, 'quote', '')}”
                    </blockquote>
                    {prop(props, 'author', '') && (
                        <cite
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm not-italic"
                        >
                            — {prop(props, 'author', '')}
                        </cite>
                    )}
                </SectionShell>
            );
        },
    },
    {
        type: 'alert',
        group: 'Basic',
        label: 'Alert',
        description: 'A coloured notice box',
        fields: [
            {
                type: 'select',
                key: 'kind',
                label: 'Type',
                options: [
                    { value: 'info', label: 'Info' },
                    { value: 'success', label: 'Success' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'danger', label: 'Danger' },
                ],
                default: 'info',
            },
            { type: 'text', key: 'title', label: 'Title', default: 'Heads up' },
            {
                type: 'textarea',
                key: 'body',
                label: 'Message',
                default: 'Something the visitor should know.',
            },
        ],
        Render: ({ props }) => {
            const kind = String(prop(props, 'kind', 'info'));
            const palette: Record<string, CSSProperties> = {
                info: {
                    background: '#eff6ff',
                    borderColor: '#bfdbfe',
                    color: '#1e3a8a',
                },
                success: {
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#166534',
                },
                warning: {
                    background: '#fffbeb',
                    borderColor: '#fde68a',
                    color: '#92400e',
                },
                danger: {
                    background: '#fef2f2',
                    borderColor: '#fecaca',
                    color: '#991b1b',
                },
            };
            return (
                <SectionShell>
                    <div
                        style={palette[kind] ?? palette.info}
                        className="rounded-md border p-4 text-sm"
                    >
                        {prop(props, 'title', '') && (
                            <p className="mb-1 font-semibold">
                                {prop(props, 'title', '')}
                            </p>
                        )}
                        <p className="whitespace-pre-line">
                            {prop(props, 'body', '')}
                        </p>
                    </div>
                </SectionShell>
            );
        },
    },
    {
        type: 'starRating',
        group: 'Basic',
        label: 'Star rating',
        description: 'A row of stars',
        fields: [
            {
                type: 'number',
                key: 'rating',
                label: 'Rating (0–5)',
                min: 0,
                max: 5,
                default: 5,
            },
            { type: 'text', key: 'title', label: 'Caption', default: '' },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'left',
            },
        ],
        Render: ({ props }) => {
            const rating = Math.max(
                0,
                Math.min(5, Number(prop(props, 'rating', 5))),
            );
            return (
                <SectionShell
                    className={`flex flex-col gap-1 ${alignItems(String(prop(props, 'align', 'left')))}`}
                >
                    <div
                        className="flex gap-0.5"
                        style={{ color: 'var(--sb-primary)' }}
                    >
                        {Array.from({ length: 5 }, (_, i) => (
                            <IconGlyph
                                key={i}
                                name="star"
                                style={{
                                    width: 20,
                                    height: 20,
                                    fill:
                                        i < Math.round(rating)
                                            ? 'currentColor'
                                            : 'transparent',
                                    opacity: i < Math.round(rating) ? 1 : 0.35,
                                }}
                            />
                        ))}
                    </div>
                    {prop(props, 'title', '') && (
                        <span
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-xs"
                        >
                            {prop(props, 'title', '')}
                        </span>
                    )}
                </SectionShell>
            );
        },
    },
    {
        type: 'googleMap',
        group: 'Basic',
        label: 'Google map',
        description: 'An embedded map for an address',
        fields: [
            {
                type: 'text',
                key: 'query',
                label: 'Address or place',
                default: 'Sofia, Bulgaria',
            },
            {
                type: 'number',
                key: 'zoom',
                label: 'Zoom',
                min: 1,
                max: 20,
                default: 13,
            },
            {
                type: 'number',
                key: 'height',
                label: 'Height (px)',
                min: 160,
                max: 640,
                default: 360,
            },
        ],
        Render: ({ props }) => {
            const q = encodeURIComponent(String(prop(props, 'query', '')));
            return (
                <SectionShell>
                    <iframe
                        title="map"
                        loading="lazy"
                        className="w-full rounded-md border-0"
                        style={{ height: `${prop(props, 'height', 360)}px` }}
                        src={`https://maps.google.com/maps?q=${q}&z=${prop(props, 'zoom', 13)}&output=embed`}
                    />
                </SectionShell>
            );
        },
    },
    {
        type: 'htmlEmbed',
        group: 'Basic',
        label: 'HTML / embed',
        description: 'Paste any embed or custom HTML',
        fields: [
            {
                type: 'html',
                key: 'code',
                label: 'HTML',
                default: '<!-- Paste an embed snippet here -->',
            },
        ],
        Render: ({ props }) => (
            <SectionShell>
                <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: String(prop(props, 'code', '')),
                    }}
                />
            </SectionShell>
        ),
    },
    {
        type: 'video',
        group: 'Media',
        label: 'Video',
        description: 'A YouTube or Vimeo video',
        fields: [
            {
                type: 'text',
                key: 'url',
                label: 'Video URL',
                default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            },
            {
                type: 'select',
                key: 'ratio',
                label: 'Aspect ratio',
                options: [
                    { value: '16/9', label: '16:9' },
                    { value: '4/3', label: '4:3' },
                    { value: '1/1', label: '1:1' },
                ],
                default: '16/9',
            },
        ],
        Render: ({ props }) => {
            const url = embedUrl(String(prop(props, 'url', '')));
            return (
                <SectionShell>
                    <div
                        className="w-full overflow-hidden rounded-md"
                        style={{
                            aspectRatio: String(prop(props, 'ratio', '16/9')),
                            background: 'var(--sb-muted)',
                        }}
                    >
                        {url && (
                            <iframe
                                title="video"
                                src={url}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="size-full border-0"
                            />
                        )}
                    </div>
                </SectionShell>
            );
        },
    },
];
