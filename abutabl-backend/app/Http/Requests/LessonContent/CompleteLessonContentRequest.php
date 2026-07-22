<?php

namespace App\Http\Requests\LessonContent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-030 — Canonical lesson content completion payload (F-029a contract).
 */
class CompleteLessonContentRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('user-api')->check();
    }

    public function rules()
    {
        return [
            'evidence' => 'required|array',
            'evidence.kind' => 'required|string|in:media_ended,media_threshold,explicit_confirm',
            'evidence.client_event_id' => 'required|uuid',
            'evidence.occurred_at' => 'nullable|date',
            'evidence.media' => 'nullable|array',
            'evidence.media.duration_ms' => 'nullable|integer|min:1',
            'evidence.media.position_ms' => 'nullable|integer|min:0',
            'evidence.viewer' => 'nullable|array',
            'evidence.viewer.loaded' => 'nullable|boolean',
        ];
    }
}
