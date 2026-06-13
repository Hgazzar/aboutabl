<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Ads;
use App\Rules\isArabic;
use App\Rules\isEnglish;
class UpdateAdsRequest extends FormRequest
{

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [                 
                 'description' =>  ['required','string','min:5','max:5000'],
                 'photo'       =>  ['nullable','mimes:jpg,jpeg,png,gif','max:5000000']
            ];
    }
         public function attributes()
    {
        return [
          
        ];
    }
}
