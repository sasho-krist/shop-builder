import { Head, router } from '@inertiajs/react';
import { ChevronDown, Circle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import messages from '@/routes/messages';

type MessageRow = {
    id: number;
    form_name: string | null;
    page_title: string | null;
    is_read: boolean;
    data: { label: string; value: string }[];
    created_at: string | null;
    created_at_full: string | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
};

type Props = {
    messages: Paginated<MessageRow>;
    unread: number;
};

export default function MessagesIndex({ messages: page, unread }: Props) {
    const { t } = useT();
    const [openId, setOpenId] = useState<number | null>(null);

    function toggleOpen(message: MessageRow) {
        const next = openId === message.id ? null : message.id;
        setOpenId(next);
        if (next !== null && !message.is_read) {
            router.patch(
                messages.update(message.id).url,
                { is_read: true },
                { preserveScroll: true, preserveState: true },
            );
        }
    }

    function setRead(message: MessageRow, isRead: boolean) {
        router.patch(
            messages.update(message.id).url,
            { is_read: isRead },
            { preserveScroll: true, preserveState: true },
        );
    }

    function destroy(message: MessageRow) {
        if (confirm(t('Delete this message?'))) {
            router.delete(messages.destroy(message.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title={t('Messages')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-xl font-semibold">{t('Messages')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {t('Submissions from the contact forms on your pages.')}
                        {unread > 0 && (
                            <span className="ml-1 font-medium">
                                {t(':count unread', { count: unread })}
                            </span>
                        )}
                    </p>
                </div>

                {page.data.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        {t('No messages yet.')}
                    </div>
                ) : (
                    <div className="border-border divide-border divide-y rounded-xl border">
                        {page.data.map((message) => {
                            const open = openId === message.id;
                            const summary = message.data
                                .slice(0, 2)
                                .map((f) => f.value)
                                .filter(Boolean)
                                .join(' · ');
                            return (
                                <div key={message.id}>
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        {!message.is_read && (
                                            <Circle
                                                className="size-2 shrink-0 fill-current text-blue-500"
                                                aria-label={t('Unread')}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleOpen(message)}
                                            className="flex flex-1 items-center gap-3 text-left"
                                        >
                                            <span
                                                className={
                                                    message.is_read
                                                        ? 'font-medium'
                                                        : 'font-semibold'
                                                }
                                            >
                                                {message.form_name ??
                                                    t('Contact form')}
                                            </span>
                                            {message.page_title && (
                                                <span className="text-muted-foreground text-xs">
                                                    {message.page_title}
                                                </span>
                                            )}
                                            <span className="text-muted-foreground hidden truncate text-sm sm:inline">
                                                {summary}
                                            </span>
                                            <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
                                                {message.created_at ?? ''}
                                            </span>
                                            <ChevronDown
                                                className={`size-4 shrink-0 transition-transform ${
                                                    open ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {open && (
                                        <div className="bg-muted/30 flex flex-col gap-3 px-4 pt-1 pb-4">
                                            <dl className="flex flex-col gap-2 text-sm">
                                                {message.data.map(
                                                    (field, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex flex-col gap-0.5 sm:flex-row sm:gap-3"
                                                        >
                                                            <dt className="text-muted-foreground sm:w-44 sm:shrink-0">
                                                                {field.label}
                                                            </dt>
                                                            <dd className="whitespace-pre-line">
                                                                {field.value ||
                                                                    '—'}
                                                            </dd>
                                                        </div>
                                                    ),
                                                )}
                                            </dl>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground mr-auto text-xs">
                                                    {message.created_at_full}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setRead(
                                                            message,
                                                            !message.is_read,
                                                        )
                                                    }
                                                >
                                                    {message.is_read
                                                        ? t('Mark as unread')
                                                        : t('Mark as read')}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        destroy(message)
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                    {t('Delete')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {page.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {t('Page :current of :last', {
                                current: page.current_page,
                                last: page.last_page,
                            })}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!page.prev_page_url}
                                onClick={() =>
                                    page.prev_page_url &&
                                    router.visit(page.prev_page_url)
                                }
                            >
                                {t('Previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!page.next_page_url}
                                onClick={() =>
                                    page.next_page_url &&
                                    router.visit(page.next_page_url)
                                }
                            >
                                {t('Next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

MessagesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Messages', href: messages.index() },
    ],
};
