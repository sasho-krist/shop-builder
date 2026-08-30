import { Head } from '@inertiajs/react';

type Props = {
    store: {
        name: string;
    };
};

export default function ComingSoon({ store }: Props) {
    return (
        <>
            <Head title={store.name} />

            <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">
                    {store.name}
                </h1>
                <p className="text-muted-foreground max-w-md text-sm">
                    This store is being set up. Check back soon.
                </p>
            </div>
        </>
    );
}
