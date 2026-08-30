import { Head, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { store } from '@/routes/onboarding';

type PageProps = {
    centralDomain: string;
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function Onboarding() {
    const { t } = useT();
    const { centralDomain } = usePage<PageProps>().props;
    const [slugTouched, setSlugTouched] = useState(false);
    const form = useForm({ name: '', slug: '' });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        form.submit(store());
    };

    return (
        <>
            <Head title={t('Create your store')} />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">{t('Store name')}</Label>
                    <Input
                        id="name"
                        name="name"
                        value={form.data.name}
                        autoFocus
                        required
                        placeholder={t('Acme Supplies')}
                        onChange={(event) => {
                            const name = event.target.value;
                            form.setData((data) => ({
                                ...data,
                                name,
                                slug: slugTouched ? data.slug : slugify(name),
                            }));
                        }}
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="slug">{t('Store address')}</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="slug"
                            name="slug"
                            value={form.data.slug}
                            required
                            className="max-w-48"
                            placeholder="acme"
                            onChange={(event) => {
                                setSlugTouched(true);
                                form.setData(
                                    'slug',
                                    slugify(event.target.value),
                                );
                            }}
                        />
                        <span className="text-muted-foreground text-sm">
                            .{centralDomain}
                        </span>
                    </div>
                    <InputError message={form.errors.slug} />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={form.processing}
                >
                    {form.processing && <Spinner />}
                    {t('Create store')}
                </Button>
            </form>
        </>
    );
}

Onboarding.layout = {
    title: 'Create your store',
    description: 'Pick a name and address for your new online store',
};
