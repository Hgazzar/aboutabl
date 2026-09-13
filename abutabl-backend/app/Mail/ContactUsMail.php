<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactUsMail extends Mailable
{
    use Queueable, SerializesModels;

    /** @var array{first_name: string, email: string, message: string} */
    public $payload;

    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    public function build()
    {
        $fromAddress = (string) config('contact.from_address');
        $fromName = (string) config('contact.from_name');

        return $this->from($fromAddress, $fromName)
            ->replyTo($this->payload['email'], $this->payload['first_name'])
            ->subject('New Contact Us message — ' . $this->payload['first_name'])
            ->view('emails.contact_us')
            ->with(['payload' => $this->payload]);
    }
}
