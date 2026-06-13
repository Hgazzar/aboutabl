<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class LoginUserRequest extends FormRequest
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
            'email' => 'required',
            'password' => 'required',
        ];
    }

    public function attributes()
    {
        return [
            'email'                => __('auth.Email'),
            'password'             => __('auth.Password'),
        ];
    }


     /**
          * Get the validation messages that apply to the request.
          *
          * @return array
          */
    public function messages()
    {
    // use trans instead on Lang 
        return [
             'email.required'                    => __('auth.InsertEmail'),
             'password.required'                 => __('auth.InsertPassword')
        ];
    
    }
}
