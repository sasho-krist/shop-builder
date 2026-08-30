import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    storeName: string;
};

type Mode = 'login' | 'register';

export default function StoreAdminEntry({ storeName }: Props) {
    const [mode, setMode] = useState<Mode>('login');

    const login = useForm({ email: '', password: '' });
    const register = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submitLogin(e: React.FormEvent) {
        e.preventDefault();
        login.post('/admin/login');
    }

    function submitRegister(e: React.FormEvent) {
        e.preventDefault();
        register.post('/admin/register');
    }

    const tab =
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';

    return (
        <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-5 py-12">
            <Head title={`${storeName} — admin`} />

            <div className="w-full max-w-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold">{storeName}</h1>
                    <p className="text-muted-foreground text-sm">
                        Store admin — owners only
                    </p>
                </div>

                <div className="bg-muted mb-5 flex gap-1 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setMode('login')}
                        className={
                            mode === 'login'
                                ? `${tab} bg-background shadow-sm`
                                : `${tab} text-muted-foreground`
                        }
                    >
                        Sign in
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('register')}
                        className={
                            mode === 'register'
                                ? `${tab} bg-background shadow-sm`
                                : `${tab} text-muted-foreground`
                        }
                    >
                        Register
                    </button>
                </div>

                {mode === 'login' ? (
                    <form
                        onSubmit={submitLogin}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="l-email">Email</Label>
                            <Input
                                id="l-email"
                                type="email"
                                autoComplete="email"
                                value={login.data.email}
                                onChange={(e) =>
                                    login.setData('email', e.target.value)
                                }
                            />
                            <InputError message={login.errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="l-password">Password</Label>
                            <Input
                                id="l-password"
                                type="password"
                                autoComplete="current-password"
                                value={login.data.password}
                                onChange={(e) =>
                                    login.setData('password', e.target.value)
                                }
                            />
                            <InputError message={login.errors.password} />
                        </div>
                        <Button
                            type="submit"
                            className="mt-1 w-full"
                            disabled={login.processing}
                        >
                            {login.processing && <Spinner />}
                            Sign in to admin
                        </Button>
                    </form>
                ) : (
                    <form
                        onSubmit={submitRegister}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="r-name">Your name</Label>
                            <Input
                                id="r-name"
                                value={register.data.name}
                                onChange={(e) =>
                                    register.setData('name', e.target.value)
                                }
                            />
                            <InputError message={register.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="r-email">Email</Label>
                            <Input
                                id="r-email"
                                type="email"
                                autoComplete="email"
                                value={register.data.email}
                                onChange={(e) =>
                                    register.setData('email', e.target.value)
                                }
                            />
                            <InputError message={register.errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="r-password">Password</Label>
                            <Input
                                id="r-password"
                                type="password"
                                autoComplete="new-password"
                                value={register.data.password}
                                onChange={(e) =>
                                    register.setData('password', e.target.value)
                                }
                            />
                            <InputError message={register.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="r-password2">
                                Confirm password
                            </Label>
                            <Input
                                id="r-password2"
                                type="password"
                                autoComplete="new-password"
                                value={register.data.password_confirmation}
                                onChange={(e) =>
                                    register.setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Registering gives you full owner access to{' '}
                            {storeName}. Your password is yours to change later
                            from your profile.
                        </p>
                        <Button
                            type="submit"
                            className="mt-1 w-full"
                            disabled={register.processing}
                        >
                            {register.processing && <Spinner />}
                            Create owner account
                        </Button>
                    </form>
                )}

                <p className="text-muted-foreground mt-6 text-center text-sm">
                    <a href="/" className="underline">
                        ← Back to {storeName}
                    </a>
                </p>
            </div>
        </div>
    );
}
