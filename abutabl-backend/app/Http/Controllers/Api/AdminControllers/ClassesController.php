<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\subjectsSchools;
use App\Models\Subject;
use App\Models\SubjectsGrades;
use App\Models\TeachersGrades;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
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

class ClassesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-classes")->only("index","show");
        $this->middleware("can:add-classes")->only("store","create");
        $this->middleware("can:edit-classes")->only("update","edit");
        $this->middleware("can:activation-classes")->only("status");
        $this->middleware("can:delete-classes")->only("destroy"); 
    }

    public function index(Request $request)
    {

        if($request->has('subject_id') and $request->has('school_id'))
        {
           $school_subject = subjectsSchools::where('school_id',$request->school_id)
                                            ->where('subject_id',$request->subject_id)
                                            ->where('status','1')
                                            ->pluck('id')->toArray();

           $school_subject_grades = SubjectsGrades::whereIN('subjects_schools_id',$school_subject)
                                    ->where('status','1')
                                    ->pluck('grade_id')->toArray();   

           $classes = Classes::whereIN('grade_id',$school_subject_grades)
              ->where('status','1')
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name','status','num_students')
              ->with('students')
              ->get(); 

        }

         elseif($request->has('school_id'))
           {
              $classes = Classes::where('school_id',$request->school_id)
              ->where('status','1')
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name','status','num_students')
              ->get();
           }//

        elseif($request->has('teacher_id'))
           {
             $user     = User::find(request('teacher_id'));
             $school_subject_grades = TeachersGrades::where('user_id',$user->id)
                                          ->where('user_id',$user->id)
                                          ->where('status','1')
                                          ->pluck('class_id')->toArray();

             $classes = Classes::whereIN('id',$school_subject_grades)
              ->where('status','1')
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name','status','num_students')
              ->with('students')
              ->get(); 
           }

        else
           {
               $classes = Classes::whereIN('grade_id',is_array($request->grade_id)?$request->grade_id:[$request->grade_id])
              ->whereIN('status',request()->has('filter_status')?[$request->filter_status]:['0','1'])
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name','status','num_students')
              ->with('students')
              ->get();
           }

           return response()->json([
            'status'  => true ,
            'classes'=>$classes,
            ] , 200); 
          
    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name"      => "required|min:1|max:20",
                "status"    => "nullable|in:1,0",
                "grade_id"  => "required|exists:grades,id",
                "num_students" => "nullable",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
              $check = Classes::where('name',$request->name)
                       ->where('grade_id',$request->grade_id)
                       ->first();

              $grade = Grades::find($request->grade_id);

                if($check and $grade)
                  return $this->returnError('E001',__('api.class name has already been taken'));

                 Classes::create([
                   'name'        => $request->name,
                   'num_students'=> $request->num_students??0,
                   'status'      => 1,
                   'grade_id'    => $grade->id,
                   'school_id'   => $grade->school_id,
                   'created_by' => auth()->user()->id
                 ]);
           
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Class Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
           try {

           $rules = [
                "name"           => "required|min:1|max:20",
                "num_students"    => "nullable",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             $check = Classes::where('name',$request->name)
                       ->where('id','!=',$id)
                       ->where('grade_id',$request->grade_id)
                       ->first();
            if($check)
            {
                 return $this->returnError('E001',__('api.name has already been taken'));
            }               

              Classes::where('id',$id)->update([
                   'name'        => $request->name,
                   'num_students'=> (isset($request->num_students) && $request->num_students !== '') ? $request->num_students : 0,
                   'status'      => $request->status,
                   'grade_id'  => $request->grade_id,
                ]);
            
              return $this -> returnSuccessMessage( __('api.Class Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id=0,Request $request)
    {
         try {

          if($id > 0)
          {
             $class    = Classes::find($id);
                if(!$class)
                 {
                  return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                 }

               $students = Student::When($request->search,function($query) use($request){
                    $query->where('name','like','%'.$request->search.'%');
                })
                ->where('class_id',$id) 
                ->orderBy('created_at',$request->order ?? 'desc')
                ->select('id','name','status')
                ->paginate($request->paginate ?? 6);

              return response()->json([
              'status'  => true,
              'class' => $class->name,
              'students' => $students,
              ] , 200); 
          }
        elseif(request()->has('class_id') and !empty(request('class_id')))
         {
             $students = Student::whereIN('class_id',$request->class_id)
                ->where('status','1') 
                ->select('id','name','school_id')
                ->get();

              return response()->json([
              'status'  => true,
              'students' => $students,
              ] , 200); 
         }

          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
     public function status($id,Request $request)
     {
        try {
         
             $class = Classes::find($id);

             if(!$class)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
         
              Classes::where('id',$id)->update([ 
                    'status'=> $class->status == '1'? '0' : '1',
                ]);     
          return $this -> returnSuccessMessage( __('api.Class Updated Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
        try {
        
          $total_student=Student::where('class_id',$id)->count();

              if($total_student != 0)
              {
                return $this->returnError('E001',__('api.cannot delete this item'));
              }

              Classes::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.Class Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}