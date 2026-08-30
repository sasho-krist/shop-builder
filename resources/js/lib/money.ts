/** Format a decimal-string amount with a currency symbol. */
export function money(amount: string | null, symbol: string): string {
    if (amount === null || amount === '') {
        return '—';
    }
    return `${amount} ${symbol}`;
}
