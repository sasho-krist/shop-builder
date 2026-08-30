<?php

namespace App\Support\Billing;

readonly class Plan
{
    /**
     * @param  array{products: int|null, staff: int|null, custom_domain: bool, card_payments: bool}  $limits
     */
    public function __construct(
        public string $key,
        public string $name,
        public int $price,
        public ?string $stripePrice,
        public array $limits,
    ) {}

    public function isFree(): bool
    {
        return $this->stripePrice === null && $this->price === 0;
    }

    public function subscribable(): bool
    {
        return $this->stripePrice !== null;
    }

    /**
     * A boolean feature flag ("custom_domain", "card_payments").
     */
    public function allows(string $feature): bool
    {
        return (bool) ($this->limits[$feature] ?? false);
    }

    /**
     * A numeric cap ("products", "staff"); null means unlimited.
     */
    public function limit(string $key): ?int
    {
        $value = $this->limits[$key] ?? null;

        return is_int($value) ? $value : null;
    }
}
