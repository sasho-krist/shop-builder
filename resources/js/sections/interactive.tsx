import { useEffect, useRef, useState } from 'react';
import { prop, rows, type SectionDef } from '@/lib/blocks';
import { IconGlyph, SOCIAL_NETWORKS } from './icons';
import {
    ALIGN_OPTIONS,
    alignItems,
    gridCols,
    Heading,
    SectionShell,
} from './shared';

const str = (v: string | number | boolean | null | undefined) =>
    v == null ? '' : String(v);

function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
    const ref = useRef<T>(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || seen) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setSeen(true);
                    io.disconnect();
                }
            },
            { threshold: 0.3 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [seen]);
    return [ref, seen];
}

function Panels({
    items,
    single,
}: {
    items: { title: string; content: string }[];
    single: boolean;
}) {
    const [open, setOpen] = useState<number[]>(single ? [0] : []);
    const toggle = (i: number) =>
        setOpen((cur) =>
            cur.includes(i)
                ? cur.filter((n) => n !== i)
                : single
                  ? [i]
                  : [...cur, i],
        );
    return (
        <div
            style={{
                borderColor: 'var(--sb-border)',
                borderRadius: 'var(--sb-radius)',
            }}
            className="divide-y overflow-hidden border [&>*]:border-[color:var(--sb-border)]"
        >
            {items.map((item, i) => (
                <div key={i}>
                    <button
                        type="button"
                        onClick={() => toggle(i)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
                    >
                        {item.title}
                        <IconGlyph
                            name="circle-help"
                            style={{
                                width: 16,
                                height: 16,
                                opacity: 0.5,
                                transform: open.includes(i)
                                    ? 'rotate(180deg)'
                                    : 'none',
                            }}
                        />
                    </button>
                    {open.includes(i) && (
                        <div
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="px-4 pb-4 text-sm whitespace-pre-line"
                        >
                            {item.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

const PANEL_FIELDS = {
    type: 'repeater' as const,
    key: 'items',
    label: 'Panels',
    itemLabel: 'Panel',
    fields: [
        {
            type: 'text' as const,
            key: 'title',
            label: 'Title',
            default: 'Title',
        },
        {
            type: 'textarea' as const,
            key: 'content',
            label: 'Content',
            default: 'Content goes here.',
        },
    ],
    default: [
        { title: 'First', content: 'The first panel.' },
        { title: 'Second', content: 'The second panel.' },
        { title: 'Third', content: 'The third panel.' },
    ],
};

export const INTERACTIVE_SECTIONS: SectionDef[] = [
    {
        type: 'tabs',
        group: 'Advanced',
        label: 'Tabs',
        description: 'Content split across tabs',
        fields: [{ ...PANEL_FIELDS }],
        Render: ({ props }) => {
            const items = rows(props, 'items').map((r) => ({
                title: str(r.title),
                content: str(r.content),
            }));
            return <Tabs items={items} />;
        },
    },
    {
        type: 'accordion',
        group: 'Advanced',
        label: 'Accordion',
        description: 'Collapsible panels, one open at a time',
        fields: [{ ...PANEL_FIELDS }],
        Render: ({ props }) => (
            <SectionShell>
                <Panels
                    single
                    items={rows(props, 'items').map((r) => ({
                        title: str(r.title),
                        content: str(r.content),
                    }))}
                />
            </SectionShell>
        ),
    },
    {
        type: 'toggle',
        group: 'Advanced',
        label: 'Toggle',
        description: 'Collapsible panels, any number open',
        fields: [{ ...PANEL_FIELDS }],
        Render: ({ props }) => (
            <SectionShell>
                <Panels
                    single={false}
                    items={rows(props, 'items').map((r) => ({
                        title: str(r.title),
                        content: str(r.content),
                    }))}
                />
            </SectionShell>
        ),
    },
    {
        type: 'faq',
        group: 'Advanced',
        label: 'FAQ',
        description: 'Questions and answers',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Frequently asked',
            },
            {
                type: 'repeater',
                key: 'items',
                label: 'Questions',
                itemLabel: 'Question',
                fields: [
                    {
                        type: 'text',
                        key: 'title',
                        label: 'Question',
                        default: 'A common question?',
                    },
                    {
                        type: 'textarea',
                        key: 'content',
                        label: 'Answer',
                        default: 'A clear answer.',
                    },
                ],
                default: [
                    {
                        title: 'How long does delivery take?',
                        content: 'Usually 1–3 working days.',
                    },
                    {
                        title: 'What is your return policy?',
                        content: '30 days, no questions asked.',
                    },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col gap-4">
                <Heading text={str(prop(props, 'heading', ''))} />
                <Panels
                    single
                    items={rows(props, 'items').map((r) => ({
                        title: str(r.title),
                        content: str(r.content),
                    }))}
                />
            </SectionShell>
        ),
    },
    {
        type: 'counters',
        group: 'Advanced',
        label: 'Counters',
        description: 'Animated number counters',
        fields: [
            {
                type: 'number',
                key: 'columns',
                label: 'Columns',
                min: 2,
                max: 4,
                default: 3,
            },
            {
                type: 'repeater',
                key: 'items',
                label: 'Counters',
                itemLabel: 'Counter',
                fields: [
                    {
                        type: 'text',
                        key: 'value',
                        label: 'Number',
                        default: '1000',
                    },
                    {
                        type: 'text',
                        key: 'prefix',
                        label: 'Prefix',
                        default: '',
                    },
                    {
                        type: 'text',
                        key: 'suffix',
                        label: 'Suffix',
                        default: '+',
                    },
                    {
                        type: 'text',
                        key: 'label',
                        label: 'Label',
                        default: 'Happy customers',
                    },
                ],
                default: [
                    {
                        value: '5000',
                        prefix: '',
                        suffix: '+',
                        label: 'Orders shipped',
                    },
                    {
                        value: '4.9',
                        prefix: '',
                        suffix: '/5',
                        label: 'Average rating',
                    },
                    {
                        value: '30',
                        prefix: '',
                        suffix: ' days',
                        label: 'Free returns',
                    },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell>
                <div
                    className="grid grid-cols-2 gap-6 text-center sm:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]"
                    style={gridCols(Number(prop(props, 'columns', 3)))}
                >
                    {rows(props, 'items').map((c, i) => (
                        <Counter
                            key={i}
                            value={str(c.value)}
                            prefix={str(c.prefix)}
                            suffix={str(c.suffix)}
                            label={str(c.label)}
                        />
                    ))}
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'progressBars',
        group: 'Advanced',
        label: 'Progress bars',
        description: 'Labelled skill / progress bars',
        fields: [
            {
                type: 'repeater',
                key: 'items',
                label: 'Bars',
                itemLabel: 'Bar',
                fields: [
                    {
                        type: 'text',
                        key: 'label',
                        label: 'Label',
                        default: 'Label',
                    },
                    {
                        type: 'text',
                        key: 'percent',
                        label: 'Percent (0–100)',
                        default: '75',
                    },
                ],
                default: [
                    { label: 'Organic ingredients', percent: '95' },
                    { label: 'Recyclable packaging', percent: '80' },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col gap-4">
                {rows(props, 'items').map((b, i) => {
                    const pct = Math.max(
                        0,
                        Math.min(100, Number(b.percent) || 0),
                    );
                    return (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between text-sm">
                                <span>{str(b.label)}</span>
                                <span
                                    style={{
                                        color: 'var(--sb-muted-foreground)',
                                    }}
                                >
                                    {pct}%
                                </span>
                            </div>
                            <div
                                style={{ background: 'var(--sb-muted)' }}
                                className="h-2 overflow-hidden rounded-full"
                            >
                                <div
                                    style={{
                                        width: `${pct}%`,
                                        background: 'var(--sb-primary)',
                                    }}
                                    className="h-full rounded-full transition-[width] duration-700"
                                />
                            </div>
                        </div>
                    );
                })}
            </SectionShell>
        ),
    },
    {
        type: 'countdown',
        group: 'Advanced',
        label: 'Countdown',
        description: 'A timer counting down to a date',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Sale ends in',
            },
            {
                type: 'text',
                key: 'target',
                label: 'Target date (YYYY-MM-DD HH:MM)',
                default: '2026-12-31 23:59',
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col items-center gap-4 text-center">
                <Heading text={str(prop(props, 'heading', ''))} />
                <Countdown target={str(prop(props, 'target', ''))} />
            </SectionShell>
        ),
    },
    {
        type: 'animatedHeadline',
        group: 'Advanced',
        label: 'Animated headline',
        description: 'A headline with rotating words',
        fields: [
            {
                type: 'text',
                key: 'before',
                label: 'Before text',
                default: 'We make',
            },
            {
                type: 'text',
                key: 'after',
                label: 'After text',
                default: 'for you.',
            },
            {
                type: 'repeater',
                key: 'words',
                label: 'Rotating words',
                itemLabel: 'Word',
                fields: [
                    {
                        type: 'text',
                        key: 'text',
                        label: 'Word',
                        default: 'great things',
                    },
                ],
                default: [
                    { text: 'clean food' },
                    { text: 'honest goods' },
                    { text: 'better habits' },
                ],
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
            const words = rows(props, 'words')
                .map((w) => str(w.text))
                .filter(Boolean);
            return (
                <SectionShell
                    className={`flex ${alignItems(str(prop(props, 'align', 'center')))}`}
                >
                    <h2
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-3xl font-bold"
                    >
                        {str(prop(props, 'before', ''))}{' '}
                        <RotatingWord words={words} />{' '}
                        {str(prop(props, 'after', ''))}
                    </h2>
                </SectionShell>
            );
        },
    },
    {
        type: 'socialIcons',
        group: 'Content',
        label: 'Social icons',
        description: 'Links to your social profiles',
        fields: [
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: ALIGN_OPTIONS,
                default: 'center',
            },
            {
                type: 'repeater',
                key: 'items',
                label: 'Profiles',
                itemLabel: 'Profile',
                fields: [
                    {
                        type: 'select',
                        key: 'network',
                        label: 'Network',
                        options: SOCIAL_NETWORKS,
                        default: 'facebook',
                    },
                    { type: 'text', key: 'url', label: 'URL', default: '' },
                ],
                default: [
                    { network: 'instagram', url: '' },
                    { network: 'facebook', url: '' },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell
                className={`flex ${alignItems(str(prop(props, 'align', 'center')))}`}
            >
                <div className="flex gap-3">
                    {rows(props, 'items').map((s, i) => (
                        <a
                            key={i}
                            href={str(s.url) || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: 'var(--sb-muted)' }}
                            className="flex size-10 items-center justify-center rounded-full"
                        >
                            <IconGlyph
                                name={str(s.network)}
                                style={{ width: 18, height: 18 }}
                            />
                        </a>
                    ))}
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'gallery',
        group: 'Media',
        label: 'Image gallery',
        description: 'A grid of images',
        fields: [
            {
                type: 'number',
                key: 'columns',
                label: 'Columns',
                min: 2,
                max: 5,
                default: 3,
            },
            {
                type: 'repeater',
                key: 'images',
                label: 'Images',
                itemLabel: 'Image',
                fields: [
                    {
                        type: 'image',
                        key: 'image',
                        label: 'Image',
                        default: '',
                    },
                    {
                        type: 'text',
                        key: 'caption',
                        label: 'Caption',
                        default: '',
                    },
                ],
                default: [
                    { image: '', caption: '' },
                    { image: '', caption: '' },
                    { image: '', caption: '' },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell>
                <div
                    className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]"
                    style={gridCols(Number(prop(props, 'columns', 3)))}
                >
                    {rows(props, 'images').map((g, i) => (
                        <figure
                            key={i}
                            style={{
                                background: 'var(--sb-muted)',
                                borderRadius: 'var(--sb-radius)',
                            }}
                            className="aspect-square overflow-hidden"
                        >
                            {str(g.image) && (
                                <img
                                    src={str(g.image)}
                                    alt={str(g.caption)}
                                    className="size-full object-cover"
                                />
                            )}
                        </figure>
                    ))}
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'imageCarousel',
        group: 'Media',
        label: 'Image carousel',
        description: 'A sliding row of images',
        fields: [
            {
                type: 'boolean',
                key: 'autoplay',
                label: 'Auto-play',
                default: true,
            },
            {
                type: 'repeater',
                key: 'images',
                label: 'Slides',
                itemLabel: 'Slide',
                fields: [
                    {
                        type: 'image',
                        key: 'image',
                        label: 'Image',
                        default: '',
                    },
                ],
                default: [{ image: '' }, { image: '' }, { image: '' }],
            },
        ],
        Render: ({ props }) => (
            <SectionShell>
                <Carousel
                    autoplay={Boolean(prop(props, 'autoplay', true))}
                    images={rows(props, 'images').map((s) => str(s.image))}
                />
            </SectionShell>
        ),
    },
    {
        type: 'testimonialCarousel',
        group: 'Advanced',
        label: 'Testimonial carousel',
        description: 'Rotating customer quotes',
        fields: [
            {
                type: 'repeater',
                key: 'items',
                label: 'Testimonials',
                itemLabel: 'Testimonial',
                fields: [
                    {
                        type: 'textarea',
                        key: 'quote',
                        label: 'Quote',
                        default: 'A short, glowing review.',
                    },
                    {
                        type: 'image',
                        key: 'image',
                        label: 'Photo',
                        default: '',
                    },
                    {
                        type: 'text',
                        key: 'name',
                        label: 'Name',
                        default: 'Customer',
                    },
                    {
                        type: 'text',
                        key: 'role',
                        label: 'Role',
                        default: 'Verified buyer',
                    },
                ],
                default: [
                    {
                        quote: 'Exceeded my expectations.',
                        image: '',
                        name: 'Maria D.',
                        role: 'Sofia',
                    },
                    {
                        quote: 'Fast shipping and lovely packaging.',
                        image: '',
                        name: 'Ivan P.',
                        role: 'Plovdiv',
                    },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell>
                <TestimonialCarousel
                    items={rows(props, 'items').map((r) => ({
                        quote: str(r.quote),
                        image: str(r.image),
                        name: str(r.name),
                        role: str(r.role),
                    }))}
                />
            </SectionShell>
        ),
    },
];

function Tabs({ items }: { items: { title: string; content: string }[] }) {
    const [active, setActive] = useState(0);
    if (items.length === 0) return null;
    const current = items[Math.min(active, items.length - 1)];
    return (
        <SectionShell className="flex flex-col gap-4">
            <div
                style={{ borderColor: 'var(--sb-border)' }}
                className="flex flex-wrap gap-1 border-b"
            >
                {items.map((item, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setActive(i)}
                        style={{
                            borderColor:
                                i === active
                                    ? 'var(--sb-primary)'
                                    : 'transparent',
                            color:
                                i === active
                                    ? 'var(--sb-foreground)'
                                    : 'var(--sb-muted-foreground)',
                        }}
                        className="-mb-px border-b-2 px-3 py-2 text-sm font-medium"
                    >
                        {item.title}
                    </button>
                ))}
            </div>
            <p
                style={{ color: 'var(--sb-muted-foreground)' }}
                className="text-sm whitespace-pre-line"
            >
                {current.content}
            </p>
        </SectionShell>
    );
}

function Counter({
    value,
    prefix,
    suffix,
    label,
}: {
    value: string;
    prefix: string;
    suffix: string;
    label: string;
}) {
    const [ref, seen] = useInView<HTMLDivElement>();
    const target = parseFloat(value.replace(',', '.'));
    const decimals = value.includes('.') ? 1 : 0;
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!seen || Number.isNaN(target)) return;
        const start = performance.now();
        const dur = 1200;
        let raf = 0;
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / dur);
            setN(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [seen, target]);
    const shown = Number.isNaN(target) ? value : n.toFixed(decimals);
    return (
        <div ref={ref} className="flex flex-col gap-1">
            <span
                style={{ fontFamily: 'var(--sb-heading-font)' }}
                className="text-4xl font-bold"
            >
                {prefix}
                {shown}
                {suffix}
            </span>
            <span
                style={{ color: 'var(--sb-muted-foreground)' }}
                className="text-sm"
            >
                {label}
            </span>
        </div>
    );
}

function Countdown({ target }: { target: string }) {
    const end = new Date(target.replace(' ', 'T')).getTime();
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const diff = Math.max(0, end - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const cells: [number, string][] = [
        [d, 'days'],
        [h, 'hrs'],
        [m, 'min'],
        [s, 'sec'],
    ];
    return (
        <div className="flex gap-4">
            {cells.map(([n, unit]) => (
                <div key={unit} className="flex flex-col items-center">
                    <span
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-3xl font-bold tabular-nums"
                    >
                        {String(n).padStart(2, '0')}
                    </span>
                    <span
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="text-xs uppercase"
                    >
                        {unit}
                    </span>
                </div>
            ))}
        </div>
    );
}

function RotatingWord({ words }: { words: string[] }) {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (words.length < 2) return;
        const id = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
        return () => clearInterval(id);
    }, [words.length]);
    return (
        <span
            key={i}
            style={{ color: 'var(--sb-primary)' }}
            className="animate-in fade-in slide-in-from-bottom-2 inline-block duration-500"
        >
            {words[i] ?? ''}
        </span>
    );
}

function Carousel({
    autoplay,
    images,
}: {
    autoplay: boolean;
    images: string[];
}) {
    const [i, setI] = useState(0);
    const list = images.filter(Boolean);
    useEffect(() => {
        if (!autoplay || list.length < 2) return;
        const id = setInterval(() => setI((n) => (n + 1) % list.length), 3500);
        return () => clearInterval(id);
    }, [autoplay, list.length]);
    if (list.length === 0)
        return (
            <div
                style={{ background: 'var(--sb-muted)' }}
                className="aspect-[16/9] w-full rounded-md"
            />
        );
    return (
        <div className="relative overflow-hidden rounded-md">
            <img
                src={list[i % list.length]}
                alt=""
                className="aspect-[16/9] w-full object-cover"
            />
            {list.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                    {list.map((_, n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setI(n)}
                            className="size-2 rounded-full"
                            style={{
                                background:
                                    n === i % list.length
                                        ? '#fff'
                                        : 'rgba(255,255,255,0.5)',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TestimonialCarousel({
    items,
}: {
    items: { quote: string; image: string; name: string; role: string }[];
}) {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (items.length < 2) return;
        const id = setInterval(() => setI((n) => (n + 1) % items.length), 5000);
        return () => clearInterval(id);
    }, [items.length]);
    if (items.length === 0) return null;
    const t = items[i % items.length];
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <p
                style={{ fontFamily: 'var(--sb-heading-font)' }}
                className="animate-in fade-in max-w-2xl text-xl font-medium duration-500"
                key={i}
            >
                “{t.quote}”
            </p>
            <div className="flex items-center gap-3">
                {t.image && (
                    <img
                        src={t.image}
                        alt=""
                        className="size-10 rounded-full object-cover"
                    />
                )}
                <span className="text-sm">
                    <span className="font-semibold">{t.name}</span>
                    {t.role && (
                        <span style={{ color: 'var(--sb-muted-foreground)' }}>
                            {' '}
                            · {t.role}
                        </span>
                    )}
                </span>
            </div>
            {items.length > 1 && (
                <div className="flex gap-1.5">
                    {items.map((_, n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setI(n)}
                            className="size-2 rounded-full"
                            style={{
                                background:
                                    n === i % items.length
                                        ? 'var(--sb-primary)'
                                        : 'var(--sb-border)',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
