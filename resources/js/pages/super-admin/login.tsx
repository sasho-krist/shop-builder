import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import AppLogoIcon from '@/components/app-logo-icon';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

export default function SuperAdminLogin() {
    const { t } = useT();
    const form = useForm({ username: '', password: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/super-admin/login', { preserveScroll: true });
    }

    return (
        <div className="bg-background flex min-h-screen items-center justify-center p-6">
            <Head title={t('Operator sign in')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="w-full max-w-sm">
                <div className="mb-8 flex flex-col items-center gap-2">
                    <AppLogoIcon className="h-9 w-auto" />
                    <h1 className="text-lg font-semibold">
                        {t('Operator panel')}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t('Platform administration — restricted access.')}
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="username">{t('Username')}</Label>
                        <Input
                            id="username"
                            name="username"
                            autoFocus
                            autoComplete="username"
                            value={form.data.username}
                            onChange={(e) =>
                                form.setData('username', e.target.value)
                            }
                        />
                        <InputError message={form.errors.username} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('Password')}</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        {t('Sign in')}
                    </Button>
                </form>
            </div>
        </div>
    );
}
