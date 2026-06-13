<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
use App\Models\SubjectActivity;
use App\Models\ActivityLesson;
use App\Models\LessonsContents;
use App\Models\UnitsPrivatesstudents;
use App\Models\UnitsSchools;
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

class SubjectActivitiesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        // $this->middleware("can:view-SubjectActivity")->only("index","show");
        // $this->middleware("can:add-SubjectActivity")->only("store","create");
        // $this->middleware("can:edit-SubjectActivity")->only("update","edit");
        // $this->middleware("can:activation-SubjectActivity")->only("status");
        // $this->middleware("can:delete-SubjectActivity")->only("destroy"); 
    }

    public function index($type, Request $request)
    {
        
        $subject_activities = SubjectActivity::where('type', $type)->When($request->search,function($query) use($request){
                                $query->where('name_en','like','%'.$request->search.'%')
                                ->orwhere('name_ar','like','%'.$request->search.'%');
                            });
        
        if($request->has('paginate') and $request->paginate > 0) {
            $subject_activities = $subject_activities->latest()->paginate($request->paginate ?? 6);
        } else {
            $subject_activities = $subject_activities->latest()->get();
        }
        return response()->json([
            'status'  => true ,
            'data'=>$subject_activities,
            ] , 200);
          

    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["required","string","min:2,","max:100"],
                "type"      => "required",
                "subject_id"=> "required|exists:subjects,id",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
              $check1 = SubjectActivity::where('type', $request->type)->where('subject_id',$request->subject_id)->where('name_en',$request->name_en)->first();
              $check2 = SubjectActivity::where('type', $request->type)->where('subject_id',$request->subject_id)->where('name_ar',$request->name_ar)->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Subject Activity name has already been taken'));
                } 

                 SubjectActivity::create([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'status'      => 1,
                   'subject_id'  => $request->subject_id,
                   'type'        => $request->type,
                   'created_by'  => auth()->user()->id
                 ]);
           
                 return $this -> returnSuccessMessage( __('api.Subject Activity Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
           try {

              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["required","string","min:2,","max:100"],
                "type"      => "required",
                "subject_id"=> "required|exists:subjects,id",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
              $subject_activity  = SubjectActivity::find($id);
             if(!$subject_activity)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

              $check1 = SubjectActivity::where('type', $request->type)->where([['subject_id',$subject_activity->subject_id],['id','!=',$id]])
                       ->where('name_en',$request->name_en)
                       ->first();

              $check2 = SubjectActivity::where('type', $request->type)->where([['subject_id',$subject_activity->subject_id],['id','!=',$id]])
                       ->where('name_ar',$request->name_ar)
                       ->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Subject Activity name has already been taken'));
                } 

                 SubjectActivity::where('id',$id)->update([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar,
                //   'status'      => 1,
                   'subject_id'  => $request->subject_id,
                   'type'        => $request->type,
                   'updated_by'  => auth()->user()->id
                 ]);
            
              return $this -> returnSuccessMessage( __('api.Subject Activity Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id,Request $request)
    {
         try {

            $subject_activity = SubjectActivity::find($id);
              
              if(!$subject_activity)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

             $lessons = ActivityLesson::When($request->search,function($query) use($request){
                  $query->where('name_'.app()->getLocale(),'like','%'.$request->search.'%');
              })
              ->where('subject_activity_id',$id) 
              ->orderBy('name_ar', 'ASC')
              ->select('id','name_'.app()->getLocale().' as name','name_en','name_ar','status');

             if($request->paginate)
              $lessons = $lessons->paginate($request->paginate ?? 6);
             else
               $lessons = $lessons->get();

            return response()->json([
            'status'  => true,
            'subject_activity' => $subject_activity,
            'lessons'=>$lessons,
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function change_status($id,Request $request)
     {
        try {
             $subject_activity = SubjectActivity::find($id);
             
             if(!$subject_activity)
              return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               
              SubjectActivity::where('id',$id)->update([ 
                    'status' => (int)$subject_activity->status == 1 ? 0 : 1,
                ]);    
           return $this -> returnSuccessMessage( __('api.Subject Activity Updated Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
       try {
        
          $subject_activity     = SubjectActivity::find($id);
        //   $lessons  = Lessons::where('unit_id',$id)->pluck('id')->toArray();
            
             if(!$subject_activity)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'));

            //  if(empty($lessons))
            //   {
                 SubjectActivity::where('id',$id)->delete();
            //   }

            //  else
            //  {
            //     return $this->returnError('E001',"The Subject Activity cannot be deleted because it contains lessons");              
            //  }
                 return $this -> returnSuccessMessage( __('api.Subject Activity Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}