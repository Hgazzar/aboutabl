<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LoginResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {

        return [
            'id'        => $this->id ,
            'name'      => app()->getLocale()=='ar'?$this->name_ar:$this->name,
            'code'      => $this->memberShip,
            'username'  => $this->username , 
            'verify'    => (int) $this->verify , 
            'api_token' => $this->api_token , 
            'school_id' => $this->school_id,
            'school_name' => app()->getLocale()=='ar'?$this->school?->name_ar:$this->school?->name,
            'grade_id'  => $this->grade_id,
            'grade_name'=> $this->grade?->name,
            'class_id'  => $this->class_id,
            'class_name'=> $this->class?->name,
        ] ;

    }
    
}
