import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';

type Props = {
    store: {
        name: string;
        slug: string;
        url: string;
        plan: string;
    };
};

export default function Dashboard({ store }: Props) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{store.name}</CardTitle>
                        <CardDescription>
                            Your store is live at{' '}
                            <a
                                href={store.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                {store.url.replace(/^https?:\/\//, '')}
                            </a>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Button asChild>
                            <a
                                href={store.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Visit storefront
                            </a>
                        </Button>
                        <span className="text-muted-foreground text-sm capitalize">
                            {store.plan} plan
                        </span>
                    </CardContent>
                </Card>

                <p className="text-muted-foreground text-sm">
                    Products, themes and pages arrive in the next phases.
                </p>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
