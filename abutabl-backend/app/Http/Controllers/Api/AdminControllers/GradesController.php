<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
use App\Models\SubjectsGrades;
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

class GradesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-grades")->only("index","show");
        $this->middleware("can:add-grades")->only("store","create");
        $this->middleware("can:edit-grades")->only("update","edit");
        $this->middleware("can:activation-grades")->only("status");
        $this->middleware("can:delete-grades")->only("destroy"); 
    }

     public function index(Request $request)
    {
        try {

           $school_id = $request->school_id??$request->school_id??$this->userInfo()->school_id;

           $total_grades = Grades::where('school_id',$school_id)->count();

           $total_classes = Classes::where('school_id',$school_id)->count();

           $total_student = Student::where('school_id',$school_id)->count();

           $total_new_grades = Grades::where('school_id',$school_id)->whereMonth('created_at', now()->month)->count();

           $total_grades_active = Grades::where('school_id',$school_id)->where('status','1')
                                  ->count();
               
           $total_grades_inactive = Grades::where('school_id',$school_id)->where('status','0')
                                  ->count();

           $grades = Grades::When($request->search,function($query) use($request){
                  $query->where('name','like','%'.$request->search.'%');
              })
              ->where('school_id',$school_id) 
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name','status')
              ->withCount('classes as num_classes')
              ->withCount('students as num_students');

           if($request->has('filter_status'))
                 $grades = $grades->where('status',$request->filter_status);

            if($request->has('paginate'))
                 $grades = $grades->paginate($request->paginate);
            else
                 $grades = $grades->where('status','1')->get();

           return response()->json([
            'status'  => true ,
            'total_grades' => $total_grades,
            'total_grades_active'=>$total_grades_active,
            'total_grades_inactive'=>$total_grades_inactive,
            'total_new_grades' => $total_new_grades,
            'total_classes' => $total_classes,
            'total_student' => $total_student,
            'grades'=>$grades,
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
            if($request->has('class_name'))
            {
              $rules = [
                "class_name"      => "required|array|min:1|max:5",
                "class_name.*"    => [
                        'string',
                        'min:1',
                        'max:20', 
                  ],
                "class_numStudent"=> "nullable|array|min:1|max:5",
                "class_numStudent.*"    => [
                        'nullable',
                        'numeric',
                        'min:0',
                  ],
                "name"      => "required|string|min:1|max:20",
                "status"    => "nullable|in:1,0",
                "school_id" => "required|exists:schools,id",
               ];
            }
            else
            {
              $rules = [
                "name"      => "required|min:1|max:20",
                "status"    => "nullable|in:1,0",
               ];
            }
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = Grades::where('name',$request->name)
                       ->where('school_id',$request->school_id)
                       ->first();
            if($check)
            {
                 return $this->returnError('E001',__('api.name has already been taken'));
            } 

             DB::beginTransaction();

             $grade  = Grades::create([
                   'name'       => $request->name,
                   'status'     => $request->status ?? 1,
                   'school_id'  => $request->school_id,
                   'created_by' => auth()->user()->id
                ]);
            
            if($request->has('class_name'))
            {
              foreach ($request->class_name as $k => $c)
               {
                $check = Classes::where('name',$c)
                       ->where('school_id',$request->school_id)
                       ->where('grade_id',$grade->id)
                       ->first();
                if($check)
                {
                     return $this->returnError('E001',__('api.class name has already been taken'));
                } 
                 Classes::create([
                   'name'       => $c,
                   'num_students'=> $request->class_numStudent[$k]??0,
                   'status'     => $request->class_status[$k]??0,
                   'grade_id'   => $grade->id,
                   'school_id'  => $request->school_id,
                   'created_by' => auth()->user()->id
                 ]);
               }
            }
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Grade Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
           try {
              $rules = [
                "name"      => "required|min:1|max:20",
                "status"    => "nullable|in:1,0",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $grade  = Grades::find($id);
             if(!$grade)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               

            $check = Grades::where('name',$request->name)
                       ->where('id','!=',$id)
                       ->where('school_id',$this->userInfo()->school_id)
                       ->first();
            if($check)
            {
                 return $this->returnError('E001',__('api.name has already been taken'));
            } 

             DB::beginTransaction();

             
          
             $grade  = Grades::where('id',$id)->update([
                   'name'       => $request->name,
                   'status'     => $request->status ?? $grade->status,
                ]);
            
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Grade Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function show($id,Request $request)
    {
        try {
            
            $grade  = Grades::find($id);
             if(!$grade)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
            
             $classes = Classes::When($request->search,function($query) use($request){
                  $query->where('name','like','%'.$request->search.'%');
              })
              ->where('grade_id',$id) 
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name','status')
              ->withCount('students as num_students')
              ->paginate($request->paginate ?? 6);

            return response()->json([
            'status'  => true ,
            'grade' => $grade->name,
            'classes' => $classes,
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
     public function status($id,Request $request){
        try {
          
            $grade  = Grades::find($id);
             if(!$grade)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

             DB::beginTransaction();
         
             
              if(!request()->has('school_id') and !request()->has('subject_id'))
              {
                Grades::where('id',$id)->update([ 
                      'status'=> $grade->status == '1'? '0' : '1',
                  ]);
              }
              else
              {
                  $subject_school = SubjectsGrades::where('school_id',$request->school_id)
                                ->where('subject_id',$request->subject_id)
                                ->where('grade_id',$id)
                                ->first();  

                  $subject_school = SubjectsGrades::where('school_id',$request->school_id)
                              ->where('subject_id',$request->subject_id)
                              ->where('grade_id',$id)
                              ->update([ 'status'=> $subject_school->status == '1'? '0' : '1',]);  

              }
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Grade Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request){
        try {

            $grade  = Grades::find($id);
             if(!$grade)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

               DB::beginTransaction();

              if(!request()->has('school_id') and !request()->has('subject_id'))
              {
                    $total_classes=Classes::where('grade_id',$id)->count();
                    $total_student=Student::where('grade_id',$id)->count();

                        if($total_classes != 0 or $total_student != 0)
                        {
                          return $this->returnError('E001',__('api.cannot delete this item, this grade contain classes or student'));
                        }
                        Grades::where('id',$id)->delete();      
              }
             else
              {
                  SubjectsGrades::where('school_id',$request->school_id)
                                ->where('subject_id',$request->subject_id)
                                ->where('grade_id',$id)
                                ->delete();   
              }
              DB::commit();
             return $this -> returnSuccessMessage( __('api.Grade Deleted Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}