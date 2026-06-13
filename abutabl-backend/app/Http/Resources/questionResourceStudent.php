<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use DB ;
use App\Helpers\Helper;

class questionResourceStudent extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
           $answer =  []; $answer2 = [];
           $data =  [
            'id'        => $this->id ,
            'type'      => $this->type,
            'code'      => $this->code,
            ] ;

           
    	    $data['question']  = ['lines'=>Helper::GetAnswerDataArray($this->question)];
    		

            if($this->type=='MCQ')
             {
          		 for ($i=1; $i <= 8; $i++) { 
          		   if($this['answer'.$i] != Null)
          		   {	 
      		         $answer[$i]  = Helper::GetAnswerData($this['answer'.$i]);	
          		   }
          		 }
              $data['answers_type'] = Helper::GetAnswerExtension($this['answer1']); 
              $data['answer'] = $answer;

              foreach (explode(',',Helper::GetAnswerData($this->corAnswer)) as $key => $value) {
                $mcqAnswer[$key]  =  array_search( $value,$data['answer']);
               }

              $data['corAnswer'] = $mcqAnswer;
            }
    		elseif($this->type=='Matching')
    		{
              for ($i=1; $i <= 8; $i++) { 
               if($this['answer'.$i] != Null)
               {     
                 $answer[$i]  = Helper::GetAnswerData($this['answer'.$i]);  
               }
             }
              $data['answer'] = $answer;
    		    for ($i=1; $i <= 8; $i++) 
                 { 
	    		   if($this['answer1_'.$i] != Null)
	    		   {  
			         $answer2[$i]  = Helper::GetAnswerData($this['answer1_'.$i]);
	    		   }
	    		 }
               $data['answer2']       = $answer2;
               $data['answers_type']  = Helper::GetAnswerExtension($this['answer1']); 
               $data['answers_type2'] = Helper::GetAnswerExtension($this['answer1_1']);  
               $data['corAnswer']     = explode(',',str_replace(":","|",Helper::GetAnswerData($this->corAnswer)));
               $colcorectAnswer1      = [];
               $colcorectAnswer2      = [];
               $colcorectAnswer       = [];
               foreach ($data['corAnswer'] as $j => $col) 
               {
                $arr = explode('|', $col);
                $colcorectAnswer1[] = $arr[1].'_'.$arr[0];  
               }

              sort($colcorectAnswer1);

               foreach ($colcorectAnswer1 as $j => $col) 
               {
                $colcorectAnswer[] = Helper::GetAnswerData($this['answer'.explode('_',$col)[1]]);  
               }

               $data['corAnswerCol1'] =  $colcorectAnswer ;
    		}

    	   elseif($this->type=='TF')
    		{
    			if($this->reason)
                 $data['reason']  = Helper::GetAnswerData($this->reason);
                 $data['reason_is_required']  = $this->reason_is_required;
                 $data['corAnswer'] = Helper::GetAnswerData($this->corAnswer);
    		}
          else
          {
            $data['corAnswer'] = Helper::GetAnswerData($this->corAnswer);
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
