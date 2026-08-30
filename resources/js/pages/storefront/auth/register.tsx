import { Head, Link, useForm } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';

const inputClass = 'w-full rounded-md border px-3 py-2 text-sm outline-none';

export default function StorefrontRegister() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const errors = form.errors as Record<string, string>;

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/account/register');
    }

    return (
        <StorefrontLayout>
            <Head title="Create account" />

            <div
                className="mx-auto w-full px-4 py-14"
                style={{ maxWidth: '420px' }}
            >
                <h1
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="mb-6 text-3xl font-bold"
                >
                    Create account
                </h1>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <input
                            placeholder="Full name"
                            value={form.data.name}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        {errors.name && (
                            <p className="text-destructive mt-1 text-xs">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
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
                            placeholder="Password"
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
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={form.data.password_confirmation}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                form.setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
                            }
                        />
                    </div>

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
                        Create account
                    </button>
                </form>

                <p
                    style={{ color: 'var(--sb-muted-foreground)' }}
                    className="mt-4 text-sm"
                >
                    Already have an account?{' '}
                    <Link href="/account/login" className="underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </StorefrontLayout>
    );
}
