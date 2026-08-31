import { prop, rows, type SectionDef } from '@/lib/blocks';
import { IconGlyph } from './icons';
import {
    ALIGN_OPTIONS,
    alignItems,
    Btn,
    GRID_CLASS,
    gridCols,
    Heading,
    SectionShell,
} from './shared';

const str = (v: string | number | boolean | null | undefined) =>
    v == null ? '' : String(v);

export const BOX_SECTIONS: SectionDef[] = [
    {
        type: 'iconBox',
        group: 'Content',
        label: 'Icon box',
        description: 'An icon above a title and text',
        fields: [
            { type: 'icon', key: 'icon', label: 'Icon', default: 'truck' },
            {
                type: 'text',
                key: 'title',
                label: 'Title',
                default: 'Free delivery',
            },
            {
                type: 'textarea',
                key: 'body',
                label: 'Text',
                default: 'On every order over the threshold.',
            },
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
            const align = str(prop(props, 'align', 'center'));
            const inner = (
                <div className={`flex flex-col gap-2 ${alignItems(align)}`}>
                    <IconGlyph
                        name={str(prop(props, 'icon', 'truck'))}
                        style={{
                            width: 40,
                            height: 40,
                            color: 'var(--sb-primary)',
                        }}
                    />
                    <Heading
                        text={str(prop(props, 'title', ''))}
                        className="text-lg font-semibold"
                    />
                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="max-w-sm text-sm"
                    >
                        {str(prop(props, 'body', ''))}
                    </p>
                </div>
            );
            const link = str(prop(props, 'link', ''));
            return (
                <SectionShell>
                    {link ? <a href={link}>{inner}</a> : inner}
                </SectionShell>
            );
        },
    },
    {
        type: 'imageBox',
        group: 'Content',
        label: 'Image box',
        description: 'An image above a title and text',
        fields: [
            { type: 'image', key: 'image', label: 'Image', default: '' },
            {
                type: 'text',
                key: 'title',
                label: 'Title',
                default: 'A short title',
            },
            {
                type: 'textarea',
                key: 'body',
                label: 'Text',
                default: 'A sentence or two of supporting copy.',
            },
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
            const align = str(prop(props, 'align', 'center'));
            const src = str(prop(props, 'image', ''));
            const inner = (
                <div className={`flex flex-col gap-3 ${alignItems(align)}`}>
                    <div
                        style={{
                            background: 'var(--sb-muted)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="aspect-video w-full max-w-md overflow-hidden"
                    >
                        {src && (
                            <img
                                src={src}
                                alt=""
                                className="size-full object-cover"
                            />
                        )}
                    </div>
                    <Heading
                        text={str(prop(props, 'title', ''))}
                        className="text-lg font-semibold"
                    />
                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="max-w-md text-sm"
                    >
                        {str(prop(props, 'body', ''))}
                    </p>
                </div>
            );
            const link = str(prop(props, 'link', ''));
            return (
                <SectionShell>
                    {link ? <a href={link}>{inner}</a> : inner}
                </SectionShell>
            );
        },
    },
    {
        type: 'iconList',
        group: 'Content',
        label: 'Icon list',
        description: 'A checklist with icons',
        fields: [
            {
                type: 'number',
                key: 'columns',
                label: 'Columns',
                min: 1,
                max: 3,
                default: 1,
            },
            {
                type: 'repeater',
                key: 'items',
                label: 'Items',
                itemLabel: 'Entry',
                fields: [
                    {
                        type: 'icon',
                        key: 'icon',
                        label: 'Icon',
                        default: 'check',
                    },
                    {
                        type: 'text',
                        key: 'text',
                        label: 'Text',
                        default: 'List item',
                    },
                    { type: 'text', key: 'link', label: 'Link', default: '' },
                ],
                default: [
                    { icon: 'check', text: 'First point', link: '' },
                    { icon: 'check', text: 'Second point', link: '' },
                    { icon: 'check', text: 'Third point', link: '' },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell>
                <ul
                    className="grid gap-2.5 sm:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]"
                    style={gridCols(Number(prop(props, 'columns', 1)))}
                >
                    {rows(props, 'items').map((item, i) => {
                        const body = (
                            <span className="flex items-center gap-2.5 text-sm">
                                <IconGlyph
                                    name={str(item.icon)}
                                    style={{
                                        width: 18,
                                        height: 18,
                                        color: 'var(--sb-primary)',
                                    }}
                                />
                                {str(item.text)}
                            </span>
                        );
                        return (
                            <li key={i}>
                                {str(item.link) ? (
                                    <a href={str(item.link)}>{body}</a>
                                ) : (
                                    body
                                )}
                            </li>
                        );
                    })}
                </ul>
            </SectionShell>
        ),
    },
    {
        type: 'features',
        group: 'Content',
        label: 'Features grid',
        description: 'A grid of icon + title + text cards',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Why shop with us',
            },
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
                label: 'Features',
                itemLabel: 'Feature',
                fields: [
                    {
                        type: 'icon',
                        key: 'icon',
                        label: 'Icon',
                        default: 'leaf',
                    },
                    {
                        type: 'text',
                        key: 'title',
                        label: 'Title',
                        default: 'Feature',
                    },
                    {
                        type: 'textarea',
                        key: 'body',
                        label: 'Text',
                        default: 'A short description.',
                    },
                ],
                default: [
                    {
                        icon: 'leaf',
                        title: 'Natural',
                        body: 'Clean ingredients, nothing extra.',
                    },
                    {
                        icon: 'truck',
                        title: 'Fast delivery',
                        body: 'Ships within one working day.',
                    },
                    {
                        icon: 'shield-check',
                        title: 'Guaranteed',
                        body: '30-day no-questions returns.',
                    },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col gap-6">
                <Heading text={str(prop(props, 'heading', ''))} />
                <div
                    className={GRID_CLASS}
                    style={gridCols(Number(prop(props, 'columns', 3)))}
                >
                    {rows(props, 'items').map((item, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <IconGlyph
                                name={str(item.icon)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    color: 'var(--sb-primary)',
                                }}
                            />
                            <span
                                style={{ fontFamily: 'var(--sb-heading-font)' }}
                                className="font-semibold"
                            >
                                {str(item.title)}
                            </span>
                            <p
                                style={{ color: 'var(--sb-muted-foreground)' }}
                                className="text-sm"
                            >
                                {str(item.body)}
                            </p>
                        </div>
                    ))}
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'testimonial',
        group: 'Content',
        label: 'Testimonial',
        description: 'A single customer quote',
        fields: [
            {
                type: 'textarea',
                key: 'quote',
                label: 'Quote',
                default: 'Genuinely the best I have tried. Fast shipping too.',
            },
            { type: 'image', key: 'image', label: 'Photo', default: '' },
            { type: 'text', key: 'name', label: 'Name', default: 'Maria D.' },
            {
                type: 'text',
                key: 'role',
                label: 'Role / location',
                default: 'Verified buyer',
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col items-center gap-4 text-center">
                <p
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="max-w-2xl text-xl font-medium"
                >
                    “{str(prop(props, 'quote', ''))}”
                </p>
                <div className="flex items-center gap-3">
                    {str(prop(props, 'image', '')) && (
                        <img
                            src={str(prop(props, 'image', ''))}
                            alt=""
                            className="size-10 rounded-full object-cover"
                        />
                    )}
                    <span className="text-sm">
                        <span className="font-semibold">
                            {str(prop(props, 'name', ''))}
                        </span>
                        {str(prop(props, 'role', '')) && (
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                            >
                                {' '}
                                · {str(prop(props, 'role', ''))}
                            </span>
                        )}
                    </span>
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'team',
        group: 'Content',
        label: 'Team',
        description: 'A grid of people',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'The team',
            },
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
                key: 'members',
                label: 'Members',
                itemLabel: 'Member',
                fields: [
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
                        default: 'Name',
                    },
                    {
                        type: 'text',
                        key: 'role',
                        label: 'Role',
                        default: 'Role',
                    },
                ],
                default: [
                    { image: '', name: 'Alex K.', role: 'Founder' },
                    { image: '', name: 'Maria I.', role: 'Operations' },
                    { image: '', name: 'Ivan P.', role: 'Support' },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col gap-6">
                <Heading text={str(prop(props, 'heading', ''))} />
                <div
                    className={GRID_CLASS}
                    style={gridCols(Number(prop(props, 'columns', 3)))}
                >
                    {rows(props, 'members').map((m, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center gap-2 text-center"
                        >
                            <div
                                style={{ background: 'var(--sb-muted)' }}
                                className="size-24 overflow-hidden rounded-full"
                            >
                                {str(m.image) && (
                                    <img
                                        src={str(m.image)}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                )}
                            </div>
                            <span className="font-semibold">{str(m.name)}</span>
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                                className="text-sm"
                            >
                                {str(m.role)}
                            </span>
                        </div>
                    ))}
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'logoGrid',
        group: 'Content',
        label: 'Logo grid',
        description: 'Partner or press logos',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'As seen in',
            },
            {
                type: 'number',
                key: 'columns',
                label: 'Columns',
                min: 2,
                max: 6,
                default: 4,
            },
            {
                type: 'repeater',
                key: 'logos',
                label: 'Logos',
                itemLabel: 'Logo',
                fields: [
                    { type: 'image', key: 'image', label: 'Logo', default: '' },
                    { type: 'text', key: 'link', label: 'Link', default: '' },
                ],
                default: [
                    { image: '', link: '' },
                    { image: '', link: '' },
                    { image: '', link: '' },
                    { image: '', link: '' },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col gap-5">
                <Heading
                    text={str(prop(props, 'heading', ''))}
                    className="text-center text-lg font-semibold"
                />
                <div
                    className="grid grid-cols-2 items-center gap-8 sm:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]"
                    style={gridCols(Number(prop(props, 'columns', 4)))}
                >
                    {rows(props, 'logos').map((logo, i) => {
                        const img = str(logo.image) ? (
                            <img
                                src={str(logo.image)}
                                alt=""
                                className="mx-auto h-10 w-auto object-contain opacity-70"
                            />
                        ) : (
                            <div
                                style={{ background: 'var(--sb-muted)' }}
                                className="mx-auto h-10 w-24 rounded"
                            />
                        );
                        return (
                            <div key={i}>
                                {str(logo.link) ? (
                                    <a href={str(logo.link)}>{img}</a>
                                ) : (
                                    img
                                )}
                            </div>
                        );
                    })}
                </div>
            </SectionShell>
        ),
    },
    {
        type: 'priceList',
        group: 'Content',
        label: 'Price list',
        description: 'A menu-style list with prices',
        fields: [
            { type: 'text', key: 'heading', label: 'Heading', default: 'Menu' },
            {
                type: 'repeater',
                key: 'items',
                label: 'Items',
                itemLabel: 'Row',
                fields: [
                    {
                        type: 'text',
                        key: 'title',
                        label: 'Name',
                        default: 'Item name',
                    },
                    {
                        type: 'text',
                        key: 'body',
                        label: 'Description',
                        default: '',
                    },
                    {
                        type: 'text',
                        key: 'price',
                        label: 'Price',
                        default: '0.00',
                    },
                ],
                default: [
                    {
                        title: 'House blend',
                        body: 'Single origin, medium roast',
                        price: '9.90',
                    },
                    {
                        title: 'Cold brew',
                        body: '18-hour steep',
                        price: '6.50',
                    },
                ],
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex flex-col gap-4">
                <Heading text={str(prop(props, 'heading', ''))} />
                <ul className="flex flex-col">
                    {rows(props, 'items').map((item, i) => (
                        <li
                            key={i}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className="flex items-baseline gap-3 border-b py-2.5 last:border-0"
                        >
                            <span className="font-medium">
                                {str(item.title)}
                            </span>
                            <span
                                style={{ borderColor: 'var(--sb-border)' }}
                                className="mx-1 flex-1 border-b border-dotted"
                            />
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                                className="text-sm"
                            >
                                {str(item.body)}
                            </span>
                            <span className="font-semibold">
                                {str(item.price)}
                            </span>
                        </li>
                    ))}
                </ul>
            </SectionShell>
        ),
    },
    {
        type: 'priceTable',
        group: 'Advanced',
        label: 'Pricing table',
        description: 'A single pricing plan card',
        fields: [
            {
                type: 'text',
                key: 'name',
                label: 'Plan name',
                default: 'Standard',
            },
            { type: 'text', key: 'price', label: 'Price', default: '29' },
            {
                type: 'text',
                key: 'period',
                label: 'Period',
                default: '/ month',
            },
            {
                type: 'repeater',
                key: 'features',
                label: 'Features',
                itemLabel: 'Feature',
                fields: [
                    {
                        type: 'text',
                        key: 'text',
                        label: 'Text',
                        default: 'Included feature',
                    },
                ],
                default: [
                    { text: 'Everything in Free' },
                    { text: 'Priority support' },
                    { text: 'Custom domain' },
                ],
            },
            {
                type: 'text',
                key: 'buttonLabel',
                label: 'Button label',
                default: 'Choose plan',
            },
            {
                type: 'text',
                key: 'buttonUrl',
                label: 'Button link',
                default: '',
            },
            {
                type: 'boolean',
                key: 'featured',
                label: 'Highlight this plan',
                default: false,
            },
        ],
        Render: ({ props }) => {
            const featured = Boolean(prop(props, 'featured', false));
            return (
                <SectionShell className="flex justify-center">
                    <div
                        style={{
                            borderColor: featured
                                ? 'var(--sb-primary)'
                                : 'var(--sb-border)',
                            borderRadius: 'var(--sb-radius)',
                            borderWidth: featured ? 2 : 1,
                        }}
                        className="flex w-full max-w-xs flex-col gap-4 border p-6 text-center"
                    >
                        <span
                            style={{ fontFamily: 'var(--sb-heading-font)' }}
                            className="text-lg font-semibold"
                        >
                            {str(prop(props, 'name', ''))}
                        </span>
                        <div>
                            <span className="text-4xl font-bold">
                                {str(prop(props, 'price', ''))}
                            </span>
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                                className="text-sm"
                            >
                                {' '}
                                {str(prop(props, 'period', ''))}
                            </span>
                        </div>
                        <ul className="flex flex-col gap-1.5 text-sm">
                            {rows(props, 'features').map((f, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <IconGlyph
                                        name="check"
                                        style={{
                                            width: 15,
                                            height: 15,
                                            color: 'var(--sb-primary)',
                                        }}
                                    />
                                    {str(f.text)}
                                </li>
                            ))}
                        </ul>
                        <Btn
                            label={str(prop(props, 'buttonLabel', ''))}
                            url={str(prop(props, 'buttonUrl', ''))}
                            variant={featured ? 'solid' : 'outline'}
                            className="w-full text-center"
                        />
                    </div>
                </SectionShell>
            );
        },
    },
    {
        type: 'callToAction',
        group: 'Advanced',
        label: 'Call to action',
        description: 'A banner with a heading and a button',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Ready to try it?',
            },
            {
                type: 'textarea',
                key: 'body',
                label: 'Text',
                default: 'Join thousands of happy customers today.',
            },
            {
                type: 'text',
                key: 'buttonLabel',
                label: 'Button label',
                default: 'Get started',
            },
            {
                type: 'text',
                key: 'buttonUrl',
                label: 'Button link',
                default: '/products',
            },
            {
                type: 'image',
                key: 'background',
                label: 'Background image',
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
            const bg = str(prop(props, 'background', ''));
            const align = str(prop(props, 'align', 'center'));
            return (
                <div
                    style={{
                        background: bg
                            ? `url(${bg}) center/cover`
                            : 'var(--sb-muted)',
                        color: bg ? '#fff' : 'var(--sb-foreground)',
                    }}
                >
                    <SectionShell
                        py={4}
                        className={`flex flex-col gap-3 ${alignItems(align)}`}
                    >
                        <Heading
                            text={str(prop(props, 'heading', ''))}
                            className="text-3xl font-bold"
                        />
                        <p className="max-w-lg text-base opacity-90">
                            {str(prop(props, 'body', ''))}
                        </p>
                        <Btn
                            label={str(prop(props, 'buttonLabel', ''))}
                            url={str(prop(props, 'buttonUrl', ''))}
                            size="lg"
                        />
                    </SectionShell>
                </div>
            );
        },
    },
    {
        type: 'flipBox',
        group: 'Advanced',
        label: 'Flip box',
        description: 'A card that flips on hover',
        fields: [
            {
                type: 'icon',
                key: 'icon',
                label: 'Front icon',
                default: 'sparkles',
            },
            {
                type: 'text',
                key: 'frontTitle',
                label: 'Front title',
                default: 'Hover me',
            },
            {
                type: 'text',
                key: 'backTitle',
                label: 'Back title',
                default: 'Nice to meet you',
            },
            {
                type: 'textarea',
                key: 'backBody',
                label: 'Back text',
                default: 'Put the detail the visitor wants on the back.',
            },
            {
                type: 'text',
                key: 'buttonLabel',
                label: 'Back button',
                default: 'Learn more',
            },
            {
                type: 'text',
                key: 'buttonUrl',
                label: 'Back button link',
                default: '',
            },
        ],
        Render: ({ props }) => (
            <SectionShell className="flex justify-center">
                <div className="sb-flip group relative h-64 w-full max-w-sm [perspective:1000px]">
                    <div className="relative size-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                        <div
                            style={{
                                background: 'var(--sb-muted)',
                                borderRadius: 'var(--sb-radius)',
                            }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center [backface-visibility:hidden]"
                        >
                            <IconGlyph
                                name={str(prop(props, 'icon', 'sparkles'))}
                                style={{
                                    width: 40,
                                    height: 40,
                                    color: 'var(--sb-primary)',
                                }}
                            />
                            <span
                                style={{ fontFamily: 'var(--sb-heading-font)' }}
                                className="text-lg font-semibold"
                            >
                                {str(prop(props, 'frontTitle', ''))}
                            </span>
                        </div>
                        <div
                            style={{
                                background: 'var(--sb-primary)',
                                color: 'var(--sb-primary-foreground)',
                                borderRadius: 'var(--sb-radius)',
                            }}
                            className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col items-center justify-center gap-3 p-6 text-center [backface-visibility:hidden]"
                        >
                            <span
                                style={{ fontFamily: 'var(--sb-heading-font)' }}
                                className="text-lg font-semibold"
                            >
                                {str(prop(props, 'backTitle', ''))}
                            </span>
                            <p className="text-sm opacity-90">
                                {str(prop(props, 'backBody', ''))}
                            </p>
                            {str(prop(props, 'buttonLabel', '')) && (
                                <a
                                    href={
                                        str(prop(props, 'buttonUrl', '')) ||
                                        undefined
                                    }
                                    className="mt-1 rounded border border-current px-4 py-1.5 text-sm font-semibold"
                                >
                                    {str(prop(props, 'buttonLabel', ''))}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </SectionShell>
        ),
    },
];
