<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
use App\Models\ActivityLesson;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\UnitsPrivatesstudents;
use App\Models\UnitsSchools;
use App\Models\Token;
use App\Models\games;
use App\Models\Quizes;
use App\Models\WorkSheets;
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
use Maatwebsite\Excel\Facades\Excel;
// use App\Exports\EmployeesExport;
use App\Imports\ActivityQuestionsImport;

class ActivityLessonsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        // $this->middleware("can:view-ActivityLesson")->only("index","show");
        // $this->middleware("can:add-ActivityLesson")->only("store","create");
        // $this->middleware("can:edit-ActivityLesson")->only("update","edit");
        // $this->middleware("can:activation-ActivityLesson")->only("status");
        // $this->middleware("can:delete-ActivityLesson")->only("destroy"); 
    }

    public function index(Request $request)
    {
         $activity_lessons = ActivityLesson::When($request->search,function($query) use($request){
            $query->where('name_en','like','%'.$request->search.'%')
            ->orwhere('name_ar','like','%'.$request->search.'%');
        });
        
        if($request->has('paginate') and $request->paginate > 0) {
            $activity_lessons = $activity_lessons->latest()->paginate($request->paginate ?? 6);
        } else {
            $activity_lessons = $activity_lessons->latest()->get();
        }
        return response()->json([
            'status'  => true ,
            'data'=>$activity_lessons,
            ] , 200);
    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["required","string","min:2,","max:100"],
                "subject_activity_id"=> "required|exists:subject_activities,id",
               ];
            
            $validator = Validator::make($request->all(), $rules);


            if ($validator->fails()) {
                // dd($request->all(), $validator);
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
              $check1 = ActivityLesson::where('subject_activity_id',$request->subject_activity_id)->where('name_en',$request->name_en)->first();
              $check2 = ActivityLesson::where('subject_activity_id',$request->subject_activity_id)->where('name_ar',$request->name_ar)->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Activity Lesson name has already been taken'));
                } 

                 ActivityLesson::create([
                   'name_en'        => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'status'      => 1,
                   'subject_activity_id'  => $request->subject_activity_id,
                   'created_by' => auth()->user()->id
                 ]);
           
                 return $this -> returnSuccessMessage( __('api.Activity Lesson Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
           try {

              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["required","string","min:2,","max:100"],
                "subject_activity_id"=> "required|exists:subject_activities,id",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
              $activity_lesson  = ActivityLesson::find($id);
             if(!$activity_lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

              $check1 = ActivityLesson::where([['subject_activity_id',$activity_lesson->subject_activity_id],['id','!=',$id]])
                       ->where('name_en',$request->name_en)
                       ->first();

              $check2 = ActivityLesson::where([['subject_activity_id',$activity_lesson->subject_activity_id],['id','!=',$id]])
                       ->where('name_ar',$request->name_ar)
                       ->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Activity Lesson name has already been taken'));
                } 

                 ActivityLesson::where('id',$id)->update([
                   'name_en'        => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'status'      => 1,
                   'subject_activity_id'  => $request->subject_activity_id,
                   'updated_by' => auth()->user()->id
                 ]);
            
              return $this -> returnSuccessMessage( __('api.Activity Lesson Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id,Request $request)
    {
         try {
             
            $activity_lesson = ActivityLesson::with(['SubjectActivity'])->find($id);
              
          if(!$activity_lesson)
           {
            return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
           }
            // dd($activity_lesson);

             if(strtolower($activity_lesson->SubjectActivity->type) =='games'){
                 
                $lesson_activities_games  = games::where('activity_lesson_id' ,$activity_lesson->id);
              
                if($request->has('paginate') and $request->paginate > 0) {
                    $lesson_activities_games = $lesson_activities_games->latest()->paginate($request->paginate ?? 6);
                } else {
                    $lesson_activities_games = $lesson_activities_games->latest()->get();
                }
              
              return response()->json([
                'status'  => true,
                'activity_lesson' => $activity_lesson,
                'games'=>$lesson_activities_games,
                ] , 200); 
              
             }elseif(strtolower($activity_lesson->SubjectActivity->type) =='quizzes'){
                 
              $lesson_activities_quizzes  = Quizes::where('activity_lesson_id',$activity_lesson->id);
                if($request->has('paginate') and $request->paginate > 0) {
                    $lesson_activities_quizzes = $lesson_activities_quizzes->latest()->paginate($request->paginate ?? 6);
                } else {
                    $lesson_activities_quizzes = $lesson_activities_quizzes->latest()->get();
                }
              return response()->json([
                'status'  => true,
                'activity_lesson' => $activity_lesson,
                'quizzes'=>$lesson_activities_quizzes,
                ] , 200); 
              
             }elseif(strtolower($activity_lesson->SubjectActivity->type) =='worksheets'){
                 
              $lesson_activities_workSheets  = WorkSheets::where('activity_lesson_id',$activity_lesson->id);
              if($request->has('paginate') and $request->paginate > 0) {
                    $lesson_activities_workSheets = $lesson_activities_workSheets->latest()->paginate($request->paginate ?? 6);
                } else {
                    $lesson_activities_workSheets = $lesson_activities_workSheets->latest()->get();
                }
              return response()->json([
                'status'  => true,
                'activity_lesson' => $activity_lesson,
                'workSheets'=>$lesson_activities_workSheets,
                ] , 200); 
              
             }
             
            //  dd($lesson_activities);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
     
     public function type($id,Request $request)
     {
        try {
              $valid = $request->type == 'private'?'required':'nullable';
              $rules = [
                "type"     => "required|in:private,public",
                "school_id"=> $valid."|array|min:1",
                "school_id.*"    => [
                        'numeric',
                        'exists:schools,id',
                  ],
               ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
          
              $activity_lesson  = ActivityLesson::find($id);
             if(!$activity_lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

                ActivityLesson::where('id',$id)->update([ 
                    'type'  => $request->type,
                    'for_teacher' => $request->for_teacher??0,
                ]);
               
               UnitsSchools::where('unit_id',$id)->delete();

                if(request()->has('school_id') and count($request->school_id) > 0)
                 {
                      foreach ($request->school_id as $s_id)
                      {
                          UnitsSchools::create([
                              'unit_id'    => $id,
                              'school_id'  => $s_id,
                          ]);
                      }
                 }
               return $this -> returnSuccessMessage( __('api.Activity Lesson Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function change_status($id,Request $request)
     {
        try {
             $activity_lesson = ActivityLesson::find($id);
             
             if(!$activity_lesson)
              return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               
              ActivityLesson::where('id',$id)->update([ 
                    'status' => (int)$activity_lesson->status == 1 ? 0 : 1,
                ]);    
           return $this -> returnSuccessMessage( __('api.Activity Lesson Updated Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
       try {
        
          $activity_lesson     = ActivityLesson::find($id);
        //   $lessons  = Lessons::where('unit_id',$id)->pluck('id')->toArray();
            
             if(!$activity_lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'));

            //  if(empty($lessons))
            //   {
                 ActivityLesson::where('id',$id)->delete();
            //   }

            //  else
            //  {
            //     return $this->returnError('E001',"The Activity Lesson cannot be deleted because it contains lessons");              
            //  }
                 return $this -> returnSuccessMessage( __('api.Activity Lesson Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
    public function fileImport(Request $request)
    {
        $rules = [
            'file' => 'required|mimes:xlsx,csv,xls',
            'subject_id' => 'required|exists:subjects,id',
            'activity_lesson_id' => 'nullable|exists:activity_lessons,id',
        ];
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }

        try {
            $path = $request->file('file')->store('temp');
            $importer = new ActivityQuestionsImport((int) $request->subject_id, $request->activity_lesson_id);
            Excel::import($importer, $path);

            $skippedTotal = $importer->duplicates + $importer->skipped_other;
            $summary = [
                'imported' => $importer->imported,
                'duplicates' => $importer->duplicates,
                'links_added' => $importer->links_added,
                'skipped_other' => $importer->skipped_other,
                'skipped' => $skippedTotal,
                'quizzes_new' => $importer->quizzes_new,
                'quizzes_reused' => $importer->quizzes_reused,
                'games_new' => $importer->games_new,
                'games_reused' => $importer->games_reused,
                'worksheets_new' => $importer->worksheets_new,
                'worksheets_reused' => $importer->worksheets_reused,
                'errors' => $importer->errors,
                'note' => 'If counts look wrong, verify column B is Quizzes/Games/Worksheets, column E groups rows, and activity/lesson references in columns C–D match this subject.',
            ];

            $newWork = $importer->imported + $importer->links_added
                + $importer->quizzes_new + $importer->games_new + $importer->worksheets_new;
            if ($newWork === 0) {
                $msg = $skippedTotal > 0
                    ? 'No new questions or activity links were added. Duplicate links and skipped rows are summarized below.'
                    : 'No data was processed. Check the template, grouping column E, and activity/lesson references.';

                return $this->returnData('import_summary', $summary, $msg, 200);
            }

            $parts = [];
            if ($importer->imported > 0) {
                $parts[] = $importer->imported === 1
                    ? '1 new question'
                    : "{$importer->imported} new questions";
            }
            if ($importer->links_added > 0) {
                $parts[] = $importer->links_added === 1
                    ? '1 new quiz/game/worksheet link'
                    : "{$importer->links_added} new quiz/game/worksheet links";
            }
            if ($importer->duplicates > 0) {
                $parts[] = $importer->duplicates === 1
                    ? '1 duplicate link skipped'
                    : "{$importer->duplicates} duplicate links skipped";
            }
            if ($importer->skipped_other > 0) {
                $parts[] = $importer->skipped_other === 1
                    ? '1 row skipped (invalid or incomplete)'
                    : "{$importer->skipped_other} rows skipped (invalid or incomplete)";
            }
            $msg = 'Import finished. '.implode(', ', $parts).'.';

            return $this->returnData('import_summary', $summary, $msg, 200);
        } catch (\Throwable $e) {
            return $this->returnError('E001', 'Import failed: ' . $e->getMessage(), 422);
        }
    }

}