import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import {
    prop,
    type PreviewContext,
    type PropValue,
    rows,
    type SectionDef,
} from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import { Heading, SectionShell } from './shared';

const str = (v: string | number | boolean | null | undefined) =>
    v == null ? '' : String(v);

const FIELD_TYPES = [
    { value: 'text', label: 'Short text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'textarea', label: 'Long text' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Radio buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'switch', label: 'Switch (on / off)' },
];

const WIDTHS = [
    { value: 'full', label: 'Full width' },
    { value: 'half', label: 'Half width' },
];

type FormFieldDef = {
    key: string;
    label: string;
    type: string;
    options: string[];
    required: boolean;
    half: boolean;
};

function slugKey(label: string, index: number): string {
    const base = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return base || `field_${index + 1}`;
}

function readFields(props: Record<string, PropValue>): FormFieldDef[] {
    return rows(props, 'fields').map((row, i) => ({
        key: slugKey(str(row.label), i),
        label: str(row.label),
        type: str(row.type) || 'text',
        options: str(row.options)
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean),
        required: Boolean(row.required),
        half: str(row.width) === 'half',
    }));
}

const inputStyle: CSSProperties = {
    background: 'var(--sb-background)',
    color: 'var(--sb-foreground)',
    borderColor: 'var(--sb-border)',
    borderRadius: 'var(--sb-radius)',
};

function Field({
    field,
    value,
    onChange,
}: {
    field: FormFieldDef;
    value: string | boolean;
    onChange: (value: string | boolean) => void;
}) {
    const { t } = useT();
    const cls =
        'w-full border px-3 py-2 text-sm outline-none focus:border-[color:var(--sb-primary)]';

    if (field.type === 'textarea') {
        return (
            <textarea
                rows={4}
                required={field.required}
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value)}
                style={inputStyle}
                className={cls}
            />
        );
    }

    if (field.type === 'dropdown') {
        return (
            <select
                required={field.required}
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value)}
                style={inputStyle}
                className={cls}
            >
                <option value="">{t('Choose…')}</option>
                {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        );
    }

    if (field.type === 'radio') {
        return (
            <div className="flex flex-col gap-1.5 pt-1">
                {field.options.map((opt) => (
                    <label
                        key={opt}
                        className="flex items-center gap-2 text-sm"
                    >
                        <input
                            type="radio"
                            name={field.key}
                            required={field.required}
                            checked={String(value ?? '') === opt}
                            onChange={() => onChange(opt)}
                            style={{ accentColor: 'var(--sb-primary)' }}
                        />
                        {opt}
                    </label>
                ))}
            </div>
        );
    }

    if (field.type === 'checkbox') {
        return (
            <label className="flex items-start gap-2 text-sm">
                <input
                    type="checkbox"
                    required={field.required}
                    checked={Boolean(value)}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ accentColor: 'var(--sb-primary)', marginTop: 2 }}
                />
                <span>{field.label}</span>
            </label>
        );
    }

    if (field.type === 'switch') {
        const on = Boolean(value);
        return (
            <label className="flex items-center justify-between gap-3 text-sm">
                <span>{field.label}</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => onChange(!on)}
                    style={{
                        background: on
                            ? 'var(--sb-primary)'
                            : 'var(--sb-border)',
                    }}
                    className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
                >
                    <span
                        className={`inline-block size-5 rounded-full bg-white transition-transform ${
                            on ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                    />
                </button>
            </label>
        );
    }

    return (
        <input
            type={
                field.type === 'email' || field.type === 'tel'
                    ? field.type
                    : 'text'
            }
            required={field.required}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
            className={cls}
        />
    );
}

function xsrf(): string {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
}

function ContactForm({
    props,
    ctx,
}: {
    props: Record<string, PropValue>;
    ctx: PreviewContext;
}) {
    const { t } = useT();
    const fields = useMemo(() => readFields(props), [props]);
    const initial = useMemo(
        () =>
            Object.fromEntries(
                fields.map((f) => [
                    f.key,
                    f.type === 'checkbox' || f.type === 'switch' ? false : '',
                ]),
            ),
        [fields],
    );
    const [values, setValues] =
        useState<Record<string, string | boolean>>(initial);
    const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(
        'idle',
    );

    const name = str(prop(props, 'title', 'Contact form'));
    const action = ctx.formAction;

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!action) return; // editor preview — inert
        setState('sending');
        try {
            const response = await fetch(action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrf(),
                },
                body: JSON.stringify({
                    page: ctx.pageSlug ?? null,
                    form_name: name,
                    // honeypot — real users never fill this
                    company_website: '',
                    fields: fields.map((f) => ({
                        label: f.label,
                        value: values[f.key] ?? '',
                    })),
                }),
            });
            setState(response.ok ? 'sent' : 'error');
        } catch {
            setState('error');
        }
    }

    if (state === 'sent') {
        return (
            <SectionShell className="flex flex-col items-center gap-2 text-center">
                <div
                    style={{
                        background: 'var(--sb-primary)',
                        color: 'var(--sb-primary-foreground)',
                    }}
                    className="flex size-12 items-center justify-center rounded-full text-xl"
                >
                    ✓
                </div>
                <p className="text-sm">
                    {str(
                        prop(
                            props,
                            'successMessage',
                            "Thanks! We'll get back to you soon.",
                        ),
                    )}
                </p>
            </SectionShell>
        );
    }

    return (
        <SectionShell className="flex flex-col gap-4">
            {str(prop(props, 'title', '')) && (
                <Heading text={str(prop(props, 'title', ''))} />
            )}
            {str(prop(props, 'description', '')) && (
                <p
                    style={{ color: 'var(--sb-muted-foreground)' }}
                    className="max-w-2xl text-sm"
                >
                    {str(prop(props, 'description', ''))}
                </p>
            )}

            <form
                onSubmit={submit}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
                {fields.map((field) => {
                    const bare =
                        field.type === 'checkbox' || field.type === 'switch';
                    return (
                        <div
                            key={field.key}
                            className={`flex flex-col gap-1.5 ${
                                field.half ? 'sm:col-span-1' : 'sm:col-span-2'
                            }`}
                        >
                            {!bare && (
                                <label className="text-sm font-medium">
                                    {field.label}
                                    {field.required && (
                                        <span
                                            style={{
                                                color: 'var(--sb-primary)',
                                            }}
                                        >
                                            {' '}
                                            *
                                        </span>
                                    )}
                                </label>
                            )}
                            <Field
                                field={field}
                                value={values[field.key] ?? ''}
                                onChange={(v) =>
                                    setValues((cur) => ({
                                        ...cur,
                                        [field.key]: v,
                                    }))
                                }
                            />
                        </div>
                    );
                })}

                <div className="flex items-center gap-3 sm:col-span-2">
                    <button
                        type="submit"
                        disabled={state === 'sending'}
                        style={{
                            background: 'var(--sb-primary)',
                            color: 'var(--sb-primary-foreground)',
                            borderRadius: 'var(--sb-radius)',
                            fontFamily: 'var(--sb-body-font)',
                        }}
                        className="inline-block px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {state === 'sending'
                            ? t('Sending…')
                            : str(prop(props, 'submitLabel', 'Send'))}
                    </button>
                    {state === 'error' && (
                        <span className="text-sm" style={{ color: '#dc2626' }}>
                            {t('Something went wrong. Please try again.')}
                        </span>
                    )}
                    {!action && (
                        <span
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-xs"
                        >
                            {t('Preview — the form works on your live site.')}
                        </span>
                    )}
                </div>
            </form>
        </SectionShell>
    );
}

export const FORM_SECTIONS: SectionDef[] = [
    {
        type: 'contactForm',
        group: 'Content',
        label: 'Contact form',
        description:
            'A form visitors fill in — text, email, dropdown, radio, checkbox and switch fields',
        fields: [
            {
                type: 'text',
                key: 'title',
                label: 'Title',
                default: 'Send us a message',
            },
            {
                type: 'textarea',
                key: 'description',
                label: 'Description',
                default: 'Fill in the form and we will reply by email.',
            },
            {
                type: 'repeater',
                key: 'fields',
                label: 'Fields',
                itemLabel: 'Field',
                max: 20,
                fields: [
                    {
                        type: 'text',
                        key: 'label',
                        label: 'Label',
                        default: 'Field',
                    },
                    {
                        type: 'select',
                        key: 'type',
                        label: 'Type',
                        options: FIELD_TYPES,
                        default: 'text',
                    },
                    {
                        type: 'textarea',
                        key: 'options',
                        label: 'Options (one per line — dropdown / radio)',
                        default: '',
                    },
                    {
                        type: 'select',
                        key: 'width',
                        label: 'Width',
                        options: WIDTHS,
                        default: 'full',
                    },
                    {
                        type: 'boolean',
                        key: 'required',
                        label: 'Required',
                        default: false,
                    },
                ],
                default: [
                    {
                        label: 'Name',
                        type: 'text',
                        options: '',
                        width: 'half',
                        required: true,
                    },
                    {
                        label: 'Email',
                        type: 'email',
                        options: '',
                        width: 'half',
                        required: true,
                    },
                    {
                        label: 'Subject',
                        type: 'text',
                        options: '',
                        width: 'full',
                        required: false,
                    },
                    {
                        label: 'Message',
                        type: 'textarea',
                        options: '',
                        width: 'full',
                        required: true,
                    },
                ],
            },
            {
                type: 'text',
                key: 'submitLabel',
                label: 'Submit button',
                default: 'Send',
            },
            {
                type: 'textarea',
                key: 'successMessage',
                label: 'Success message',
                default: "Thanks! We'll get back to you soon.",
            },
        ],
        Render: ({ props, ctx }) => <ContactForm props={props} ctx={ctx} />,
    },
];
