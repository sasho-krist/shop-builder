import { useCallback, useEffect, useState } from 'react';

const KEY = 'sb_owner_tools_hidden';
const EVENT = 'sb:owner-tools';

function read(): boolean {
    try {
        return localStorage.getItem(KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Shared "owner editing tools are minimised" flag, so the floating bar and the
 * per-section edit affordances stay in sync (and across tabs).
 */
export function useOwnerToolsHidden(): [boolean, (hidden: boolean) => void] {
    const [hidden, setHidden] = useState(read);

    useEffect(() => {
        const sync = () => setHidden(read());
        window.addEventListener(EVENT, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const update = useCallback((next: boolean) => {
        try {
            if (next) {
                localStorage.setItem(KEY, '1');
            } else {
                localStorage.removeItem(KEY);
            }
        } catch {
            /* ignore */
        }
        setHidden(next);
        window.dispatchEvent(new Event(EVENT));
    }, []);

    return [hidden, update];
}
