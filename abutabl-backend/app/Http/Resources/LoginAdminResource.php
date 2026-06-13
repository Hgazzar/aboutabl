<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LoginAdminResource extends JsonResource
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
            'type'      => $this->type??'user',
            'username'  => $this->username , 
            'verify'    => (int) $this->verify , 
            'api_token' => $this->api_token , 
            'role_id'   => $this->role_id,
            'role_name' => $this->role_name,
            'school'    => $this->school,
            'num_school'=> $this->num_school,
            'currentLang' =>  app()->getLocale(),
            ] ;

    }
    
}
