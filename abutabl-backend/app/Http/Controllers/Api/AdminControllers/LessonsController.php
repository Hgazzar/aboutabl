<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
use App\Models\Units;
use App\Models\Lessons;
use App\Models\LessonsContents;
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

class LessonsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-lessons")->only("index","show");
        $this->middleware("can:add-lessons")->only("store");
        $this->middleware("can:edit-lessons")->only("update");
        $this->middleware("can:activation-lessons")->only("status");
        $this->middleware("can:delete-lessons")->only("destroy");
    }

    public function index(Request $request)
    {

    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"     => ["nullable","string","min:2,","max:100"],
                "status"      => "nullable|in:1,0",
                "subject_id"  => "required|exists:subjects,id",
                "unit_id"     => "required",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            

              $check1 = Lessons::where('subject_id',$request->subject_id)
                       ->where('unit_id',$request->unit_id)
                       ->where('name_en',$request->name_en)
                       ->first();

              $check2 = Lessons::where('subject_id',$request->subject_id)
                        ->where('unit_id',$request->unit_id)
                       ->where('name_ar',$request->name_ar)
                       ->first();

              $check3 = Units::where('subject_id',$request->subject_id)
                               ->where('id',$request->unit_id)
                               ->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Lesson name has already been taken'));
                } 

               if(!$check3)
                {
                     return $this->returnError('E001',__('api.not_exists_unit_for_this_data'));
                } 

                 Lessons::create([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar??$request->name_en,
                   'status'      => $request->status ?? 1,
                   'subject_id'  => $request->subject_id,
                   'unit_id'     => $request->unit_id,
                   'created_by'  => auth()->user()->id
                 ]);
           
                 return $this -> returnSuccessMessage( __('api.Lesson Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
           try {

              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["nullable","string","min:2,","max:100"],
                "unit_id"     => "nullable|exists:units,id",
                "status"    => "nullable|in:1,0",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
              $lesson  = Lessons::find($id);
             if(!$lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

              $check1 = Lessons::where([['subject_id',$lesson->subject_id],['id','!=',$id]])
                       ->where('unit_id',$request->unit_id)
                       ->where('name_en',$request->name_en)
                       ->first();

              $check2 = Lessons::where([['subject_id',$lesson->subject_id],['id','!=',$id]])
                       ->where('unit_id',$request->unit_id) 
                       ->where('name_ar',$request->name_ar)
                       ->first();


                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Unit name has already been taken'));
                } 

               if($request->unit_id != '')
                {

                    $check3 = Units::where('subject_id',$request->subject_id)
                               ->where('id',$request->unit_id)
                               ->first();
                    if(!$check3)
                    return $this->returnError('E001',__('api.not_exists_unit_for_this_data'));
                }

                 Lessons::where('id',$id)->update([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar??$request->name_ar,
                   'status'      => $request->status ??$lesson->lesson,
                   'unit_id'     => $request->unit_id ??$lesson->unit_id,
                 ]);
            
              return $this -> returnSuccessMessage( __('api.Lessons Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id,Request $request)
    {
       try {

            $lesson = Lessons::where('id',$id)
                   ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name_en as name','name_en as name_en','name_ar as name_ar','unit_id','status')
                   ->withCount('Files')
                   ->first();
              
              if(!$lesson)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }


            $contents = DB::table('lessons_contents')
              ->leftjoin('users', 'lessons_contents.created_by', '=', 'users.id')
              ->When($request->search,function($query) use($request){
                  $query->where('lessons_contents.name_'.app()->getLocale(),'like','%'.$request->search.'%')
                        ->orwhere('users.name','like','%'.$request->search.'%')
                        ->orwhere('users.name_ar','like','%'.$request->search.'%');
              })
              ->where('lessons_contents.lesson_id',$id) 
              ->orderBy('lessons_contents.created_at',$request->order ?? 'desc')
              ->select('lessons_contents.id','lessons_contents.name_'.app()->getLocale().' as name','lessons_contents.name_en','lessons_contents.name_ar','lessons_contents.status','lessons_contents.type','lessons_contents.created_at',app()->getLocale()=='ar'?'users.name_ar as createdBy':'users.name as createdBy',DB::raw("CONCAT( '".asset('/')."' ,lessons_contents.path) AS path","lessons_contents.size","lessons_contents.privacy"));

             if($request->paginate)
              $contents = $contents->paginate($request->paginate ?? 6);
             else
               $contents = $contents->get();

            return response()->json([
            'status'  => true,
            'lesson'=>$lesson,
            'contents'=>$contents
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
     
    public function status($id,Request $request)
     {
        try {
             $lesson = Lessons::find($id);

             if(!$lesson)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
         
              Lessons::where('id',$id)->update([  
                    'status'=>  $lesson->status == '1'? '0' : '1',
                ]);
               
               return $this -> returnSuccessMessage( __('api.Lesson Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
       try {
        
          $lesson  = Lessons::find($id);
            
             if(!$lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  LessonsContents::where('lesson_id',$id)->delete();
                  Lessons::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.Lesson Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}