import { Head, Link, useForm } from '@inertiajs/react';
import { useT } from '@/lib/i18n';
import StorefrontLayout from '@/layouts/storefront-layout';

const inputClass = 'w-full rounded-md border px-3 py-2 text-sm outline-none';

export default function StorefrontLogin() {
    const { t } = useT();
    const form = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const errors = form.errors as Record<string, string>;

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/account/login');
    }

    return (
        <StorefrontLayout>
            <Head title={t('Sign in')} />

            <div
                className="mx-auto w-full px-5 py-14 sm:px-8"
                style={{ maxWidth: '420px' }}
            >
                <h1
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="mb-6 text-3xl font-bold"
                >
                    {t('Sign in')}
                </h1>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <input
                            type="email"
                            placeholder={t('Email')}
                            value={form.data.email}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                        />
                        {errors.email && (
                            <p className="text-destructive mt-1 text-xs">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder={t('Password')}
                            value={form.data.password}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                        />
                        {errors.password && (
                            <p className="text-destructive mt-1 text-xs">
                                {errors.password}
                            </p>
                        )}
                    </div>
                    <label
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="flex items-center gap-2 text-sm"
                    >
                        <input
                            type="checkbox"
                            checked={form.data.remember}
                            onChange={(e) =>
                                form.setData('remember', e.target.checked)
                            }
                        />
                        {t('Remember me')}
                    </label>

                    <button
                        type="submit"
                        disabled={form.processing}
                        style={{
                            background: 'var(--sb-primary)',
                            color: 'var(--sb-primary-foreground)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="w-full px-4 py-3 font-semibold disabled:opacity-50"
                    >
                        {t('Sign in')}
                    </button>
                </form>

                <p
                    style={{ color: 'var(--sb-muted-foreground)' }}
                    className="mt-4 text-sm"
                >
                    {t('New here?')}{' '}
                    <Link href="/account/register" className="underline">
                        {t('Create an account')}
                    </Link>
                </p>
            </div>
        </StorefrontLayout>
    );
}
