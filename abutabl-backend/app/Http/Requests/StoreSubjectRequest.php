<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Subject;
use App\Rules\isArabic;
use App\Rules\isEnglish;
class StoreSubjectRequest extends FormRequest
{

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return auth('admin-api')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [                 
                "name"     => ["required","string","min:4","max:100"],
                "name_ar"  => ["required","string","min:4","max:100"],
                "des"   => "nullable|string|min:10|max:1000",
                "pass"  => "nullable|string|min:10|max:1000",
                "photo" => "required|mimes:jpg,jpeg,png",
            ];
    }
    public function attributes()
    {
        return [
          
        ];
    }
}
