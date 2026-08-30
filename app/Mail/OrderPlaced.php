<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderPlaced extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public StoreSetting $settings,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Order #{$this->order->number} confirmed",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.order-placed',
            with: [
                'order' => $this->order->loadMissing('lines'),
                'symbol' => $this->settings->currency_symbol,
            ],
        );
    }
}
