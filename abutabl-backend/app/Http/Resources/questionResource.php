<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use DB ;
use App\Helpers\Helper;

class questionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
           $data =  [
            'id'        => $this->id ,
            'type'      => $this->type,
            'code'      => $this->code,
            ] ;

           
    	    $data['question']  = Helper::GetAnswerData($this->question);
    	    $data['question_image'] = Helper::GetAnswerData($this->question_image);
    	    $data['question_audio'] = Helper::GetAnswerData($this->question_audio);
    		$data['corAnswer'] = Helper::GetAnswerData($this->corAnswer);
    		$data['corAnswer_audio'] = Helper::GetAnswerData($this->corAnswer_audio);
    		$data['corAnswer_image'] = Helper::GetAnswerData($this->corAnswer_image);

    		 for ($i=1; $i < 9; $i++) { 
    		   $answer = $this['answer'.$i];
    		   
    		   if($answer != Null)
    		   {	 
		        $data['answer'.$i]  = Helper::GetAnswerData($answer);
		        $data['answer'.$i.'_audio']  = Helper::GetAnswerData($this['answer'.$i.'_audio']);
		        $data['answer'.$i.'_image']  = Helper::GetAnswerData($this['answer'.$i.'_image']);
    		   }
    		 }

    		if($this->type=='Matching')
    		{
    			  for ($i=1; $i < 9; $i++) { 
	    		   $answer = $this['answer1_'.$i];
	    		   if($answer != Null)
	    		   {  
			        $data['answer1_'.$i]  = Helper::GetAnswerData($answer);
			        $data['answer'.$i.'_audio']  = Helper::GetAnswerData($this['answer'.$i.'_audio']);
		            $data['answer'.$i.'_image']  = Helper::GetAnswerData($this['answer'.$i.'_image']);
	    		   }
	    		 }
    		}

    	   if($this->type=='TF')
    		{
    			if($this->reason)
                 $data['reason']  = Helper::GetAnswerData($this->reason);
    			
                 $data['reason_is_required']  = $this->reason_is_required;
    		}

    		$data['add_to_question_bank'] = 1;
    		$data['subject_id']   = $this->subject_id;
    		
            if($this->subject)
            $data['subject_name'] = app()->getLocale()=='ar'?$this->subject->name_ar:$this->subject->name;
    		
            $data['unit_id'] = $this->unit_id;
    	
    	   if($this->unit)
    		$data['unit_name'] = app()->getLocale()=='ar'?$this->unit->name_ar:$this->unit->name;
    		
    		$data['lesson_id'] = $this->lesson_id;
    	
    	   if($this->lesson)
    		$data['lesson_name'] = app()->getLocale()=='ar'?$this->lesson->name_ar:$this->lesson->name;
          
           return $data;

    }
    
}
