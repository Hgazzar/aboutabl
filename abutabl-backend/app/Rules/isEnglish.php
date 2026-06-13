<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class isEnglish implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if( preg_match('/^[a-zA-Z0-9\p{Katakana}\p{Hiragana}\p{Han} $]+/u', $value))
        {
            return true ;
        }else{
            return false ;
        }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return __('api.mustInsertEn') ;
    }
}
