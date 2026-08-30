import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function ColorField({ label, value, onChange }: Props) {
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    function commit(next: string) {
        setDraft(next);
        if (HEX.test(next)) {
            onChange(next.toLowerCase());
        }
    }

    return (
        <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-normal">{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="border-border flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
                    >
                        <span
                            className="size-4 rounded-sm border"
                            style={{ background: value }}
                        />
                        <span className="font-mono uppercase">{value}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                    <div className="flex flex-col gap-3">
                        <input
                            type="color"
                            value={HEX.test(value) ? value : '#000000'}
                            onChange={(event) => commit(event.target.value)}
                            className="h-9 w-full cursor-pointer rounded-md border"
                        />
                        <Input
                            value={draft}
                            spellCheck={false}
                            className="font-mono"
                            onChange={(event) => commit(event.target.value)}
                            onBlur={() => setDraft(value)}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
