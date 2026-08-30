import { ArrowDown, ArrowUp, ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import productRoutes from '@/routes/products';

export type PickerProduct = {
    id: number;
    title: string;
    thumbnail: string | null;
};

type Props = {
    selected: PickerProduct[];
    onChange: (products: PickerProduct[]) => void;
};

function Thumb({ product }: { product: PickerProduct }) {
    return (
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
            {product.thumbnail ? (
                <img
                    src={product.thumbnail}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                <ImageIcon className="size-4" />
            )}
        </div>
    );
}

export default function CollectionProductPicker({ selected, onChange }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PickerProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [openResults, setOpenResults] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true);
            fetch(productRoutes.search({ query: { q: query } }).url, {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            })
                .then((response) => response.json())
                .then((data: PickerProduct[]) => setResults(data))
                .catch(() => undefined)
                .finally(() => setLoading(false));
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    useEffect(() => {
        function onClickOutside(event: MouseEvent) {
            if (
                boxRef.current &&
                !boxRef.current.contains(event.target as Node)
            ) {
                setOpenResults(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const selectedIds = new Set(selected.map((product) => product.id));

    function add(product: PickerProduct) {
        if (!selectedIds.has(product.id)) {
            onChange([...selected, product]);
        }
        setOpenResults(false);
        setQuery('');
    }

    function remove(id: number) {
        onChange(selected.filter((product) => product.id !== id));
    }

    function move(index: number, direction: -1 | 1) {
        const next = [...selected];
        const target = index + direction;
        if (target < 0 || target >= next.length) {
            return;
        }
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    }

    return (
        <div className="flex flex-col gap-3">
            <div ref={boxRef} className="relative">
                <Input
                    value={query}
                    placeholder="Search products to add…"
                    onFocus={() => setOpenResults(true)}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpenResults(true);
                    }}
                />
                {openResults && (
                    <div className="bg-popover animate-in fade-in-0 zoom-in-95 absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border p-1 shadow-md">
                        {loading && (
                            <div className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-sm">
                                <Loader2 className="size-4 animate-spin" />
                                Searching…
                            </div>
                        )}
                        {!loading && results.length === 0 && (
                            <div className="text-muted-foreground px-2 py-3 text-sm">
                                No products found.
                            </div>
                        )}
                        {!loading &&
                            results.map((product) => {
                                const already = selectedIds.has(product.id);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        disabled={already}
                                        onClick={() => add(product)}
                                        className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm disabled:opacity-40"
                                    >
                                        <Thumb product={product} />
                                        <span className="flex-1 truncate">
                                            {product.title}
                                        </span>
                                        {already ? (
                                            <span className="text-muted-foreground text-xs">
                                                Added
                                            </span>
                                        ) : (
                                            <Plus className="text-muted-foreground size-4" />
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                )}
            </div>

            {selected.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    No products in this collection yet.
                </p>
            ) : (
                <ul className="divide-border border-border divide-y rounded-md border">
                    {selected.map((product, index) => (
                        <li
                            key={product.id}
                            className="animate-in fade-in flex items-center gap-3 px-3 py-2 duration-200"
                        >
                            <span className="text-muted-foreground w-5 text-center text-xs">
                                {index + 1}
                            </span>
                            <Thumb product={product} />
                            <span className="flex-1 truncate text-sm font-medium">
                                {product.title}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                            >
                                <ArrowUp className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={index === selected.length - 1}
                                onClick={() => move(index, 1)}
                            >
                                <ArrowDown className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive size-7"
                                onClick={() => remove(product.id)}
                            >
                                <X className="size-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
