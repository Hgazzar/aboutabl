<?php

namespace Tests\Feature\Student;

use App\Mail\ContactUsMail;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactUsApiTest extends TestCase
{
    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    /**
     * @return array<string, string>
     */
    private function publicHeaders(): array
    {
        return [
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ];
    }

    public function test_contact_requires_api_secret(): void
    {
        $response = $this->postJson('/api/student/contact', [
            'first_name' => 'Sara',
            'email' => 'sara@example.com',
            'message' => 'Hello ABOUTABL team',
        ]);

        $response->assertStatus(400);
    }

    public function test_contact_validates_payload(): void
    {
        $response = $this->withHeaders($this->publicHeaders())
            ->postJson('/api/student/contact', [
                'first_name' => 'A',
                'email' => 'not-an-email',
                'message' => 'Hi',
            ]);

        $response->assertStatus(400)
            ->assertJson(['status' => false]);
    }

    public function test_contact_sends_mail_to_configured_inbox(): void
    {
        Mail::fake();
        config(['contact.to' => 'info@aboutabl.com']);

        $response = $this->withHeaders($this->publicHeaders())
            ->postJson('/api/student/contact', [
                'first_name' => 'Sara',
                'email' => 'sara@example.com',
                'message' => 'Hello ABOUTABL team — please contact me.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
                'errNum' => '200',
            ]);

        Mail::assertSent(ContactUsMail::class, function (ContactUsMail $mail) {
            return $mail->hasTo('info@aboutabl.com')
                && $mail->payload['first_name'] === 'Sara'
                && $mail->payload['email'] === 'sara@example.com';
        });
    }
}
