<?php

namespace App\Services\Payments;

readonly class WebhookEvent
{
    public function __construct(
        public string $type,
        public ?string $sessionId,
        public bool $paid,
    ) {}
}
