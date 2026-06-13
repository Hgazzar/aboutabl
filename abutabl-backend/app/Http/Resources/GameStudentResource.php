<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use DB ;

class GameStudentResource extends JsonResource
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
                  'id'              => $this->id ,
                  'name'            => app()->getLocale()=='ar'?$this->name_ar:$this->name_en,
                  'des'             => app()->getLocale()=='ar'?$this->des_ar:$this->des_en,
                  'background'      => $this->background ,
                  'path'            => $this->path ,
                  'code'            => $this->code ,
                  'size'            => $this->size ,
                  'ext'             => $this->ext ,
               ] ;

    }
    
}
