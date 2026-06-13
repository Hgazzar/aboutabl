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

class UnitsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-units")->only("index","show");
        $this->middleware("can:add-units")->only("store","create");
        $this->middleware("can:edit-units")->only("update","edit");
        $this->middleware("can:activation-units")->only("status");
        $this->middleware("can:delete-units")->only("destroy"); 
    }

    public function index(Request $request)
    {

    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["required","string","min:2,","max:100"],
                "status"    => "nullable|in:1,0",
                "type"      => "nullable|in:public,private",
                "subject_id"=> "required|exists:subjects,id",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
              $check1 = Units::where('subject_id',$request->subject_id)->where('name',$request->name_en)->first();
              $check2 = Units::where('subject_id',$request->subject_id)->where('name_ar',$request->name_ar)->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Unit name has already been taken'));
                } 

                 Units::create([
                   'name'        => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'status'      => $request->status ?? 1,
                   'subject_id'  => $request->subject_id,
                   'type'        => $request->type??'public',
                   'created_by' => auth()->user()->id
                 ]);
           
                 return $this -> returnSuccessMessage( __('api.Unit Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
           try {

              $rules = [
                "name_en"     => ["required","string","min:2,","max:100"],
                "name_ar"  => ["required","string","min:2,","max:100"],
                "status"    => "nullable|in:1,0",
                "type"      => "nullable|in:public,private",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
              $unit  = Units::find($id);
             if(!$unit)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

              $check1 = Units::where([['subject_id',$unit->subject_id],['id','!=',$id]])
                       ->where('name',$request->name_en)
                       ->first();

              $check2 = Units::where([['subject_id',$unit->subject_id],['id','!=',$id]])
                       ->where('name_ar',$request->name_ar)
                       ->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Unit name has already been taken'));
                } 

                 Units::where('id',$id)->update([
                   'name'        => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'status'      => $request->status ??$unit->status,
                   'type'        => $request->type ??$unit->type,
                 ]);
            
              return $this -> returnSuccessMessage( __('api.Unit Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id,Request $request)
    {
         try {

            $unit = Units::find($id);
              
              if(!$unit)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

             if($unit->type=='public')
              $unit_schools  = Schools::whereIn('id',$this->SchoolsIDs())->pluck('id')->toArray();
             else
              $unit_schools  = UnitsSchools::where('unit_id',$id)->pluck('school_id')->toArray();

             $unit = Units::where('id',$id)
                   ->select('id','name_ar as name_ar','name as name_en','status','type','for_teacher')
                   ->get();

             $schools = Schools::When($request->search,function($query) use($request){
                  $query->where('name','like','%'.$request->search.'%');
              })
              ->whereIn('id',$unit_schools) 
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name as name_en','name_ar','status');

             if($request->paginate)
              $schools = $schools->paginate($request->paginate ?? 6);
             else
               $schools = $schools->get();


             $lessons = Lessons::When($request->search,function($query) use($request){
                  $query->where('name_'.app()->getLocale(),'like','%'.$request->search.'%');
              })
              ->where('unit_id',$id) 
              ->orderBy('name_ar', 'ASC')
              ->select('id','name_'.app()->getLocale().' as name','name_en','name_ar','status')
              ->withCount('Files');

             if($request->paginate)
              $lessons = $lessons->paginate($request->paginate ?? 6);
             else
               $lessons = $lessons->get();

            return response()->json([
            'status'  => true,
            'unit' => $unit,
            'lessons'=>$lessons,
            'schools' => $schools ,
            ] , 200); 
          
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
          
              $unit  = Units::find($id);
             if(!$unit)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

                Units::where('id',$id)->update([ 
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
               return $this -> returnSuccessMessage( __('api.Unit Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function status($id,Request $request)
     {
        try {
             $unit = Units::find($id);
             
             if(!$unit)
              return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               
              Units::where('id',$id)->update([ 
                    'status'=>$unit->status=='1'?'0':'1',
                ]);    
           return $this -> returnSuccessMessage( __('api.Unit Updated Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
       try {
        
          $unit     = Units::find($id);
          $lessons  = Lessons::where('unit_id',$id)->pluck('id')->toArray();
            
             if(!$unit)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'));

             if(empty($lessons))
              {
                 Units::where('id',$id)->delete();
              }

             else
             {
                return $this->returnError('E001',"The unit cannot be deleted because it contains lessons");              
             }
                 return $this -> returnSuccessMessage( __('api.Unit Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}