<?php

namespace App\Mail;

use App\Models\Registration;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Sent when a customer registers (port of the mail() call in add_record()).
 * Carries the ticket number the customer needs for the raffle.
 */
class RegistrationReceived extends Mailable
{
    public function __construct(public Registration $registration)
    {
        $registration->loadMissing('branch:id,name');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('promo.mail.from_address'), config('promo.mail.from_name')),
            subject: config('promo.mail.subject'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.registration',
            text: 'emails.registration-text',
            with: [
                'r' => $this->registration,
                'promo' => config('promo.name'),
                'permit' => config('promo.permit_no'),
                'drawAt' => \Illuminate\Support\Carbon::parse(config('promo.draw_at'))->format('F j, Y g:i A'),
                'periodStart' => \Illuminate\Support\Carbon::parse(config('promo.period_start'))->format('F j, Y'),
                'periodEnd' => \Illuminate\Support\Carbon::parse(config('promo.period_end'))->format('F j, Y'),
            ],
        );
    }
}
