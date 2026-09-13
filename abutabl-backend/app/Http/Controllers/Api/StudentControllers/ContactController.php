<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Mail\ContactUsMail;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Throwable;

class ContactController extends Controller
{
    use GeneralTrait;

    public function __construct()
    {
        // Match public AuthApiController: set JWT student guard before api throttle
        // resolves $request->user() (web guard provider is misconfigured as `admins`).
        auth()->setDefaultDriver('user-api');
    }

    /**
     * Public landing Contact Us — emails inbox (no auth).
     */
    public function store(Request $request)
    {
        $rules = [
            'first_name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:191',
            'message' => 'required|string|min:5|max:5000',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);

            return $this->returnValidationError($code, $validator);
        }

        $to = (string) config('contact.to', 'info@aboutabl.com');
        if ($to === '') {
            return $this->returnError('E001', 'Contact inbox is not configured.', 500);
        }

        $payload = [
            'first_name' => trim((string) $request->input('first_name')),
            'email' => trim((string) $request->input('email')),
            'message' => trim((string) $request->input('message')),
        ];

        try {
            Mail::to($to)->send(new ContactUsMail($payload));
        } catch (Throwable $e) {
            report($e);

            return $this->returnError('E001', 'Unable to send your message right now. Please try again later.', 500);
        }

        return $this->returnSuccessMessage('Message sent successfully.', '200', 200);
    }
}
