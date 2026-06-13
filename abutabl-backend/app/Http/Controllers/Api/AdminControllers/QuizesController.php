<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Subject;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Questions;
use App\Models\Quizes;
use App\Models\games;
use App\Models\QuizesQuestions;
use App\Models\skills;
use App\Models\SkillsQuizes;
use App\Models\Token;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\LoginResource;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;
use App\Rules\isArabic;
use App\Rules\isEnglish;
use App\Http\Resources\questionResource;

class QuizesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-quizes")->only("index","show");
        $this->middleware("can:add-quizes")->only("store","create");
        $this->middleware("can:edit-quizes")->only("update","edit","assignQuestion");
        $this->middleware("can:activation-quizes")->only("status");
        $this->middleware("can:delete-quizes")->only("destroy"); 
    }

   public function index(Request $request)
    {
        try {
              
                 $quizes = Quizes::where('subject_id',request('subject_id'));

               if(request()->has('search'))
                $quizes = $quizes->where(function($q) {
                   $q->where('title_en','like','%'.request('search').'%')
                   ->orwhere('title_ar','like','%'.request('search').'%');
                 });

               if(request()->has('unit_id'))
                $quizes = $quizes->where('unit_id',request('unit_id'));
              
               if(request()->has('lesson_id'))
                $quizes = $quizes->where('lesson_id',request('lesson_id'));

                $quizes = $quizes->select('id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','created_at','due_date','unit_id','lesson_id','subject_id','status','code');

                if($request->has('paginate') and $request->paginate > 0)
                     $quizes = $quizes->paginate($request->paginate);
                else
                     $quizes = $quizes->get();

          return response()->json([
            'status'  => true ,
            'quizes'=>$quizes
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
           
              $rules = [
                "title_en"           => ["required","string","min:2,","max:100"],
                "title_ar"           => ["nullable","string","min:2,","max:100"],
                "instructions_en"    => ["nullable","string","min:5,","max:1000"],
                "instructions_ar"    => ["nullable","string","min:5,","max:1000"],
                "code"               => "nullable",
                "navigation_method"  => "nullable",
                "start_date"         => "nullable|date_format:Y-m-d|after_or_equal:".\carbon\carbon::parse(now())->format('Y-m-d'),
                "due_date"           => "nullable|date_format:Y-m-d|after_or_equal:".$request->start_date,
                "questions_per_page" => "nullable",
                "time_limit"         => "nullable",
                "type_time"          => "nullable|string",
                "do_when_time_end"   => "nullable|string",
                "score_method"       => "nullable|string",
                "score_to_pass"      => "nullable",
                "num_attempts"       => "nullable",
                "status"            => "nullable|in:1,0",
                "notify_student"    => "nullable|in:1,0",
                "notify_about_submission"    => "nullable|in:1,0",
                "notify_about_late_submission" => "nullable|in:1,0",
                "reminder_before_due_date" => "nullable|in:1,0",
                "unlimited_attempts"=> "nullable|in:1,0",
                "subject_id"        => "required|exists:subjects,id",
                "unit_id"           => "nullable|exists:units,id",
                "lesson_id"         => "nullable|exists:lessons,id",
                "skills_tags"        => "nullable|array|min:1|max:10",
                "skills_tags.*"   => [
                          'string',
                          'distinct', 
                    ],
                "q_id"        => "required|array|min:1|max:20",
                "q_id.*"      => [
                          'exists:questions,id',
                    ],
                "q_score"        => "required|array|min:1|max:20",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = Quizes::where('subject_id',$request->subject_id);

            if($check->where('title_en',$request->title_en)->count() != 0 
            or $check->where('title_ar',$request->title_ar)->count() != 0 )
            {
                 return $this->returnError('E001',__('api.quize has already been taken'));
            } 

             DB::beginTransaction();
             $skills = [];        
          if(request()->has('skills_tags') and !empty(request('skills_tags')))
           {

             foreach ($request->skills_tags as $skill)
              {
                 $check = skills::where('name',$skill)->first();

                 if(!$check)
                 {
                   $row =  skills::create([
                                   'name'       => $skill,
                                   'created_by' => auth()->user()->id, 
                                ]); 

                    array_push($skills,$row->id);  
                 }
                 else
                 {
                    array_push($skills,$check->id);
                 }
              }
           }
              
            $quize =  Quizes::create([
                      'title_en'          => $request->title_en,
                      'title_ar'          => $request->title_ar,
                      'instructions_en'   => $request->instructions_en,
                      'instructions_ar'   => $request->instructions_ar,
                      'code'              => $request->code,
                      'status'            => $request->status ?? '1',
                      'subject_id'        => $request->subject_id,
                      'unit_id'           => $request->unit_id,
                      'lesson_id'        => $request->lesson_id,
                      'created_by'        => auth()->user()->id,
                      'navigation_method' => $request->navigation_method??'free',
                      'questions_per_page'=>$request->questions_per_page??1,
                      'score_method'      =>$request->score_method??'points',
                      'score_to_pass'     =>$request->score_to_pass??1,
                      'unlimited_attempts'=>$request->unlimited_attempts??0,
                      'num_attempts'      =>$request->num_attempts??1,
                      'notify_student'    =>$request->notify_student??0,
                      'notify_about_submission'      =>$request->notify_about_submission??0,
                      'notify_about_late_submission' =>$request->notify_about_late_submission??0,
                      'reminder_before_due_date'     =>$request->reminder_before_due_date??0,
                      'start_date'        =>$request->start_date,
                      'due_date'          =>$request->due_date,
                      'time_limit'        =>$request->time_limit,
                      'type_time'         =>$request->type_time??'minutes',
                      'do_when_time_end'  =>$request->do_when_time_end,
                      'activity_lesson_id' => $request->activity_lesson_id ?? null,
                ]);
             
               if(count($skills) > 0)
               {
                  foreach ($skills as $skill) 
                  {
                    SkillsQuizes::create([
                        'quize_id'   => $quize->id,
                        'skill_id'  => $skill
                    ]);
                  }
               }

               if(request()->has('q_id') and !empty(request('q_id')))
               {

                 foreach ($request->q_id as $k => $q_id)
                  {
                            QuizesQuestions::create([
                                       'quize_id'    => $quize->id,
                                       'question_id' => $q_id,
                                       'score'       => request('q_score')[$k],
                                       'created_by'  => auth()->user()->id, 
                                    ]); 
                  }
               }  

                $subject = Subject::find($request->subject_id);
                $dataNotify = [];
                $dataNotify['title']      = $request->title_en;
                $dataNotify['des']        = 'New Quize Added For '.$subject->name;
                $dataNotify['url']        = '/learn/'.$request->subject_id.'/quiz/'.$quize->id;
                $dataNotify['type']       = 'quize';
                $dataNotify['type_id']    = $quize->id;
                $dataNotify['subject_id'] = $request->subject_id;

                $this->addNotifyFromTeacher($dataNotify);

          
             DB::commit();

           return $this->returnData('quize',$quize, __('api.Quize Added Successfully') ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


   public function update($id,Request $request){
        try {
           
              $rules = [
                "title_en"           => ["required","string","min:2,","max:100"],
                "title_ar"           => ["nullable","string","min:2,","max:100"],
                "instructions_en"    => ["nullable","string","min:5,","max:1000"],
                "instructions_ar"    => ["nullable","string","min:5,","max:1000"],
                "code"               => "nullable",
                "navigation_method"  => "nullable",
                "start_date"         => "nullable|date_format:Y-m-d|after_or_equal:".\carbon\carbon::parse(now())->format('Y-m-d'),
                "due_date"           => "nullable|date_format:Y-m-d|after_or_equal:".$request->start_date,
                "questions_per_page" => "nullable",
                "time_limit"         => "nullable",
                "type_time"          => "nullable|string",
                "do_when_time_end"   => "nullable|string",
                "score_method"       => "nullable|string",
                "score_to_pass"      => "nullable",
                "num_attempts"       => "nullable",
                "status"            => "nullable|in:1,0",
                "notify_student"    => "nullable|in:1,0",
                "notify_about_submission"    => "nullable|in:1,0",
                "notify_about_late_submission" => "nullable|in:1,0",
                "reminder_before_due_date" => "nullable|in:1,0",
                "unlimited_attempts"=> "nullable|in:1,0",
                "subject_id"        => "required|exists:subjects,id",
                "unit_id"           => "nullable|exists:units,id",
                "lesson_id"         => "nullable|exists:lessons,id",
                "skills_tags"        => "nullable|array|min:1|max:10",
                "skills_tags.*"   => [
                          'string',
                          'distinct', 
                    ],
                "q_id"        => "required|array|min:1|max:20",
                "q_id.*"      => [
                          'exists:questions,id',
                    ],
                "q_score"        => "required|array|min:1|max:20",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = Quizes::where('id','!=',$id);

            $quize = Quizes::where('id','=',$id)->first();

            // if(!$quize)
            // {
            //      return $this->returnError('E001',__('api.quize not found'));
            // } 

            // elseif($check->where('title_en',$request->title_en)->count() != 0 
            // or $check->where('title_ar',$request->title_ar)->count() != 0 )
            // {
            //      return $this->returnError('E001',__('api.quize has already been taken'));
            // } 



             DB::beginTransaction();
             $skills = [];        
       
          if(request()->has('skills_tags') and !empty(request('skills_tags')))
           {

             foreach ($request->skills_tags as $skill)
              {
                 $check = skills::where('name',$skill)->first();

                 if(!$check)
                 {
                   $row =  skills::create([
                                   'name'       => $skill,
                                   'created_by' => auth()->user()->id, 
                                ]); 

                    array_push($skills,$row->id);  
                 }
                 else
                 {
                    array_push($skills,$check->id);
                 }
              }
           }
              
              Quizes::where('id',$id)->update([
                      'title_en'          => $request->title_en,
                      'title_ar'          => $request->title_ar,
                      'instructions_en'   => $request->instructions_en,
                      'instructions_ar'   => $request->instructions_ar,
                      'code'              => $request->code,
                      'status'            => $request->status ?? '1',
                      'subject_id'        => $request->subject_id,
                      'unit_id'           => $request->unit_id,
                      'lesson_id'        => $request->lesson_id,
                      'created_by'        => auth()->user()->id,
                      'navigation_method' => $request->navigation_method??'free',
                      'questions_per_page'=>$request->questions_per_page??1,
                      'score_method'      =>$request->score_method??'points',
                      'score_to_pass'     =>$request->score_to_pass??1,
                      'unlimited_attempts'=>$request->unlimited_attempts??0,
                      'num_attempts'      =>$request->num_attempts??1,
                      'notify_student'    =>$request->notify_student??0,
                      'notify_about_submission'      =>$request->notify_about_submission??0,
                      'notify_about_late_submission' =>$request->notify_about_late_submission??0,
                      'reminder_before_due_date'     =>$request->reminder_before_due_date??0,
                      'start_date'        =>$request->start_date,
                      'due_date'          =>$request->due_date,
                      'time_limit'        =>$request->time_limit,
                      'type_time'         =>$request->type_time??'minutes',
                      'do_when_time_end'  =>$request->do_when_time_end,
                      'activity_lesson_id' => $request->activity_lesson_id ?? null,
                ]);
             
               SkillsQuizes::where('quize_id',$id)->delete();

               if(count($skills) > 0)
               {
                  foreach ($skills as $skill) 
                  {
                    SkillsQuizes::create([
                        'quize_id'   => $id,
                        'skill_id'  => $skill
                    ]);
                  }
               }

              QuizesQuestions::where('quize_id',$id)->delete();

               if(request()->has('q_id') and !empty(request('q_id')))
               {
                 foreach ($request->q_id as $k => $q_id)
                  {
                            QuizesQuestions::create([
                                       'quize_id'    => $id,
                                       'question_id' => $q_id,
                                       'score'       => request('q_score')[$k],
                                       'created_by'  => auth()->user()->id, 
                                    ]); 
                  }
               }  
          
             DB::commit();

           return $this->returnData('quize',$quize, 'Quize Updated Successfully' ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


   public function show($id,Request $request)
     {
       try {

                  $quize = Quizes::where('id',$id)
                    ->select('id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar','start_date as startDate','start_date','due_date as DueDate','due_date','time_limit','type_time','do_when_time_end','score_method','score_to_pass','num_attempts','code','notify_student','notify_about_submission','notify_about_late_submission','questions_per_page','navigation_method','reminder_before_due_date');
                  $SkillsQuizes = SkillsQuizes::where('quize_id',$id)->pluck('skill_id')->toArray();
                  $skills       = skills::whereIN('id',$SkillsQuizes)->select('id','name')->get();
                  $questions    = QuizesQuestions::where('quize_id',$id)->select('question_id','score',DB::raw("CONCAT( '".$quize->first()->score_method."'  ) AS score_formate"))->get();
                  $_questions   = [];
                  foreach ($questions as $k => $qu) {
                    $row = Questions::where('id',$qu['question_id'])->with('subject')->with('lesson')->first();
                    $question['info']   = new questionResource($row) ;
                    $question['score']  = $qu['score'];
                    $question['score_formate']  = $qu['score_formate'];
                    $_questions[$k]     = $question;
                  }
                

                   return  response()->json([
                    'status'  => true ,
                    'quize'    => $quize->get(),
                    'questions'=> $_questions, 
                    'skills'   => $skills,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


   public function assignQuestion($id,Request $request){
        try {
           
              $rules = [
                "q_id"        => "required|array|min:1|max:20",
                "q_id.*"      => [
                          'exists:questions,id',
                    ],
                "q_score"        => "required|array|min:1|max:20",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }


             DB::beginTransaction();
          
          QuizesQuestions::where('quize_id',$id)->delete();

          if(request()->has('q_id') and !empty(request('q_id')))
           {

             foreach ($request->q_id as $k => $q_id)
              {
                        QuizesQuestions::create([
                                   'quize_id'    => $id,
                                   'question_id' => $q_id,
                                   'score'       => request('q_score')[$k],
                                   'created_by'  => auth()->user()->id, 
                                ]); 
              }
           }  
          
             DB::commit();

             return $this -> returnSuccessMessage(  __('api.Quize Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function destroy($id,Request $request)
     {
       try {
        
          $quize  = Quizes::find($id);
            
             if(!$quize)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  QuizesQuestions::where('quize_id',$id)->delete();
                  Quizes::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.Quize Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}