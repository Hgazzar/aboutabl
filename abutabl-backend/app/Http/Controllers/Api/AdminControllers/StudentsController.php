<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Student;
use App\Models\Schools;
use App\Models\Classes;
use App\Models\StudentFamily;
use App\Models\SchoolsRoles;
use App\Models\AssignsStudents;
use App\Models\Assigns;
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
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StudentsExport;
use App\Imports\StudentsImport;

class StudentsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-students")->only("index","show","todo");
        $this->middleware("can:add-students")->only("store","create","fileImport");
        $this->middleware("can:edit-students")->only("update","edit");
        $this->middleware("can:activation-students")->only("status");
        $this->middleware("can:delete-students")->only("destroy");
        $this->middleware("can:export-students")->only("export");
    }

     public function index(Request $request)
    {
        try {


           $students_count = Student::where('school_id',$request->school_id)->count();      
           $students_active = Student::where('school_id',$request->school_id)->where('status','1')->count();
           $students_inactive = Student::where('school_id',$request->school_id)->where('status','0')->count();
           $students_new = Student::where('school_id',$request->school_id)->whereMonth('created_at', now()->month)->count();
          
           $students = DB::table('students')
                         ->leftjoin('schools', 'students.school_id', '=', 'schools.id')
                         ->leftjoin('grades', 'students.grade_id', '=', 'grades.id')
                         ->leftjoin('classes', 'students.class_id', '=', 'classes.id')
                         ->join("student_families as f",function($join){
                            $join->on("f.student_id","=","students.id")
                                ->where("f.relation","=","father");
                         })
                        ->join("student_families as m",function($join){
                            $join->on("m.student_id","=","students.id")
                                ->where("m.relation","=","mather");
                         })
                         ->When($request->search,function($query) use($request){
                                $query->where('students.name','like','%'.$request->search.'%')
                                ->orwhere('students.name_ar','like','%'.$request->search.'%')
                                ->orwhere('students.username','like','%'.$request->search.'%');
                            })
                 ->where('students.school_id',$request->school_id) 
                  ->orderBy('students.created_at',$request->order ?? 'desc')
                  ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name','grades.name  as grade','classes.name as class','schools.name as school','students.status','f.name as fatherName','m.name as matherName')
                  ->paginate($request->paginate ?? 6);

          return response()->json([
            'status'  => true ,
            'students_count'=>$students_count,
            'students_active'=>$students_active,
            'students_inactive'=>$students_inactive,
            'students_new'=>$students_new,
            'students' => $students,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
              $f = 0 ; $m = 0;
              $rules = [
                "name"       => ["required","min:3","max:20"],
                "name_ar"    => ["required","min:3","max:20"],
                "birthday" => "nullable",
                "gender"   => 'nullable|in:male,female',
                "address"   => "nullable||min:10|max:1000",
                "status"    => "nullable|in:1,0",
                "photo"     => "nullable|mimes:jpg,jpeg,png",
                "school_id" => "required|exists:schools,id",
                "grade_id"  => "required|exists:grades,id",
                "class_id"  => "required|exists:classes,id",
                "email"     => "nullable|unique:students,email",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            if($request->class_id)
            {
              $class = Classes::where('id',$request->class_id)->first();
              // If num_students is 0, there is no limit - allow unlimited students
              if($class && $class->num_students > 0)
              {
                $check_num_students = Student::where('class_id',$request->class_id)->count();
                if($class->num_students ==  $check_num_students)
                   return $this->returnError('E001',$class->name." class is full ");
              }
            }
          
            if($request->f_name != '' or $request->f_NID  != '' or $request->f_email !='' or $request->f_phone != '' or $request->f_job)
            {
               $rules = [
                "f_name"    => ["required","min:3","max:20"],
                "f_name_ar" => ["required","min:3","max:20"],
                "f_NID"     => "nullable|unique:student_families,NID",
                "f_email"   => 'nullable|email|unique:student_families,email',
                "f_phone"   => "nullable|numeric|unique:student_families,phone",
                "f_job_id"  => "nullable|exists:jobs_types,id",
               ];
           
               $validator = Validator::make($request->all(), $rules);

                if ($validator->fails()) {
                    $code = $this->returnCodeAccordingToInput($validator);
                    return $this->returnValidationError($code, $validator);
                }
                $f = 1;
            }

            if($request->m_name != '' or $request->m_NID  != '' or $request->m_email !='' or $request->m_phone != '' or $request->m_job)
            {
               $rules = [
                "m_name"    => ["required","min:3","max:20"],
                "m_name_ar" => ["required","min:3","max:20"],
                "m_NID"     => "nullable|unique:student_families,NID",
                "m_email"   => 'nullable|email|unique:student_families,email',
                "m_phone"   => "nullable|numeric|unique:student_families,phone",
                "m_job_id"  => "nullable|exists:jobs_types,id",
               ];
           
               $validator = Validator::make($request->all(), $rules);

                if ($validator->fails()) {
                    $code = $this->returnCodeAccordingToInput($validator);
                    return $this->returnValidationError($code, $validator);
                }
                $m = 1;
            }

             DB::beginTransaction();

           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'students';
                    $file->store('public/'.$path);
           }

           $password = $this->generate_password();

           $student  = Student::create([
                   'name'       => $request->name,
                   'name_ar'    => $request->name_ar,
                   'birthday'   => $request->birthday??null,
                   'gender'     => $request->gender ?? null,
                   'status'     => $request->status,
                   'address'   => $request->address ?? null,
                   'photo'=>$request->photo ? $path.'/'.$hashName : null,
                   'password'   => bcrypt($password),
                   'defaultPassword'  => $password,
                   'school_id'  => $request->school_id,
                   'grade_id'   => $request->grade_id,
                   'class_id'   => $request->class_id,
                   'email'      => $request->email,
                ]);
              

                $student_code = $this->generate_student_code($student->id);

                Student::where('id',$student->id)->update([
                  'memberShip'=> $student_code,
                  'username'=> $student_code
                ]);



                StudentFamily::create([
                  'student_id' => $student->id,
                  'relation'   => 'father',
                  'name'       => $request->f_name??'',
                  'name_ar'    => $request->f_name_ar??'',
                  'NID'        => $request->f_NID??'',
                  'email'      => $request->f_email??'',
                  'phone'      => $request->f_phone??'',
                  'job_id'     => $request->f_job_id??0,
                ]);

               StudentFamily::create([
                  'student_id' => $student->id,
                  'relation'   => 'mather',
                  'name'       => $request->m_name??'',
                  'name_ar'    => $request->m_name_ar??'',
                  'NID'        => $request->m_NID??'',
                  'email'      => $request->m_email??'',
                  'phone'      => $request->m_phone??'',
                  'job_id'     => $request->m_job_id??0,
                ]);
              
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Student Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

 public function update($id,Request $request){
        try {
              $f = 0 ; $m = 0;
              $rules = [
                "name"       => ["required","min:3","max:20"],
                "name_ar"    => ["required","min:3","max:20"],
                "birthday" => "nullable",
                "gender"   => 'nullable|in:male,female',
                "address"   => "nullable||min:10|max:1000",
                "status"    => "nullable|in:1,0",
                "photo"     => "nullable|mimes:jpg,jpeg,png",
                "school_id" => "required|exists:schools,id",
                "grade_id"  => "required|exists:grades,id",
                "class_id"  => "required|exists:classes,id",
                "email"     => "nullable|unique:users,email,".request("id"),
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            // Fetch student early to check class limit and verify existence
            $student = Student::where('id',$id)->first();
            
            if(!$student)
            {
              return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
            }

            // Check class limit when updating student's class
            if($request->class_id)
            {
              // Only check if class is being changed
              if($student->class_id != $request->class_id)
              {
                $class = Classes::where('id',$request->class_id)->first();
                // If num_students is 0, there is no limit - allow unlimited students
                if($class && $class->num_students > 0)
                {
                  $check_num_students = Student::where('class_id',$request->class_id)->count();
                  if($class->num_students ==  $check_num_students)
                     return $this->returnError('E001',$class->name." class is full ");
                }
              }
            }

            if($request->f_name != '' or $request->f_NID  != '' or $request->f_email !='' or $request->f_phone != '' or $request->f_job)
            {
              // Get father record to ensure we have an ID for exclusion in validation
              $father = StudentFamily::where('student_id', $id)->where('relation', 'father')->first();

               $rules = [
                "f_name"    => ["required","min:3","max:20"],
                "f_name_ar" => ["required","min:3","max:20"],
                "f_job_id"  => "nullable|exists:jobs_types,id",
               ];

               // Only add unique validation if the field is provided and not empty
               // Skip uniqueness check if value hasn't changed, otherwise exclude father's ID if it exists
               if(!empty($request->f_NID) && (!$father || $request->f_NID != $father->NID)) {
                   $rules["f_NID"] = ($father && $father->id) ? "nullable|unique:student_families,NID,".$father->id : "nullable|unique:student_families,NID";
               }
               if(!empty($request->f_email) && (!$father || $request->f_email != $father->email)) {
                   $rules["f_email"] = ($father && $father->id) ? "nullable|email|unique:student_families,email,".$father->id : "nullable|email|unique:student_families,email";
               }
               if(!empty($request->f_phone) && (!$father || $request->f_phone != $father->phone)) {
                   $rules["f_phone"] = ($father && $father->id) ? "nullable|numeric|unique:student_families,phone,".$father->id : "nullable|numeric|unique:student_families,phone";
               } elseif(!empty($request->f_phone)) {
                   // Phone provided but hasn't changed - just validate format
                   $rules["f_phone"] = "nullable|numeric";
               }
           
               $validator = Validator::make($request->all(), $rules);

                if ($validator->fails()) {
                    $code = $this->returnCodeAccordingToInput($validator);
                    return $this->returnValidationError($code, $validator);
                }
                $f = 1;
            }

            if($request->m_name != '' or $request->m_NID  != '' or $request->m_email !='' or $request->m_phone != '' or $request->m_job)
            {
              // Get mother record to ensure we have an ID for exclusion in validation
              $mather = StudentFamily::where('student_id', $id)->where('relation', 'mather')->first();

               $rules = [
                "m_name"    => ["required","min:3","max:20"],
                "m_name_ar" => ["required","min:3","max:20"],
                "m_job_id"  => "nullable|exists:jobs_types,id",
               ];

               // Only add unique validation if the field is provided and not empty
               // Skip uniqueness check if value hasn't changed, otherwise exclude mother's ID if it exists
               if(!empty($request->m_NID) && (!$mather || $request->m_NID != $mather->NID)) {
                   $rules["m_NID"] = ($mather && $mather->id) ? "nullable|unique:student_families,NID,".$mather->id : "nullable|unique:student_families,NID";
               }
               if(!empty($request->m_email) && (!$mather || $request->m_email != $mather->email)) {
                   $rules["m_email"] = ($mather && $mather->id) ? "nullable|email|unique:student_families,email,".$mather->id : "nullable|email|unique:student_families,email";
               }
               if(!empty($request->m_phone) && (!$mather || $request->m_phone != $mather->phone)) {
                   $rules["m_phone"] = ($mather && $mather->id) ? "nullable|numeric|unique:student_families,phone,".$mather->id : "nullable|numeric|unique:student_families,phone";
               } elseif(!empty($request->m_phone)) {
                   // Phone provided but hasn't changed - just validate format
                   $rules["m_phone"] = "nullable|numeric";
               }
           
               $validator = Validator::make($request->all(), $rules);

                if ($validator->fails()) {
                    $code = $this->returnCodeAccordingToInput($validator);
                    return $this->returnValidationError($code, $validator);
                }
                $m = 1;
            }

             DB::beginTransaction();

           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'students';
                    $file->store('public/'.$path);
           }

           Student::where('id',$id)->update([
                   'name'       => $request->name,
                   'name_ar'    => $request->name_ar,
                   'birthday'   => $request->birthday??null,
                   'gender'     => $request->gender ?? null,
                   'status'     => $request->status ?? $student->status,
                   'address'   => $request->address ?? null,
                   'photo'=>$request->photo ? $path.'/'.$hashName : $student->photo,
                   'school_id' => $request->school_id,
                   'grade_id'  => $request->grade_id,
                   'class_id'  => $request->class_id,
                   'email'     => $request->email,
                ]);

            StudentFamily::updateOrCreate(
                ['student_id' => $id, 'relation' => 'father'],
                [
                  'name'       => $request->f_name??'',
                  'name_ar'    => $request->f_name_ar??'',
                  'NID'        => $request->f_NID??'',
                  'email'      => $request->f_email??'',
                  'phone'      => $request->f_phone??'',
                  'job_id'     => $request->f_job_id??0,
                ]
            );

           StudentFamily::updateOrCreate(
                ['student_id' => $id, 'relation' => 'mather'],
                [
                  'name'       => $request->m_name??'',
                  'name_ar'    => $request->m_name_ar??'',
                  'NID'        => $request->m_NID??'',
                  'email'      => $request->m_email??'',
                  'phone'      => $request->m_phone??'',
                  'job_id'     => $request->m_job_id??0,
                ]
            );
                
                DB::commit();

             return $this -> returnSuccessMessage( __('api.Student Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function show($id,Request $request){
        try {
             $student = DB::table('students')
                  ->leftjoin('schools', 'students.school_id', '=', 'schools.id')
                  ->leftjoin('grades', 'students.grade_id', '=', 'grades.id')
                  ->leftjoin('classes', 'students.class_id', '=', 'classes.id')
                  ->join("student_families as f",function($join){
                      $join->on("f.student_id","=","students.id")
                          ->where("f.relation","=","father");
                   })
                  ->join("student_families as m",function($join){
                      $join->on("m.student_id","=","students.id")
                          ->where("m.relation","=","mather");
                   })
                  ->leftJoin('jobs_types as jf',function($query){
                      $query->on("jf.id","=","f.job_id")->where('f.job_id','!=','0');
                  })
                  ->leftJoin('jobs_types as jm',function($query){
                      $query->on("jm.id","=","m.job_id")->where('m.job_id','!=','0');
                  })
                  ->where('students.id',$id)
                  ->select('students.id','students.name as name','students.name as name_en','students.name_ar as name_ar',DB::raw("CONCAT( '".asset('/storage')."/' ,students.photo) AS photo"),'students.status','students.address','schools.name as school','grades.name as grade','classes.name as class','students.username','students.birthday','students.gender','f.name as fatherNameEn','f.name as f_name','m.name as matherNameEN','m.name as m_name','f.name_ar as fatherNameAR','f.name_ar as f_name_ar','m.name_ar as matherNameAR','m.name_ar as m_name_ar','f.NID as fatherNID','f.NID as f_NID','m.NID as matherNID','m.NID as m_NID','f.email as fatherEmail','f.email as f_email','m.email as matherEmail','m.email as m_email','f.phone as fatherPhone','f.phone as f_phone','m.phone as matherPhone','m.phone as m_phone','jf.name_'.app()->getLocale().' as fatherJobName','jf.id as f_job_id','jm.name_'.app()->getLocale().' as matherJobName','jm.id as m_job_id','students.school_id','students.class_id','students.grade_id','students.username as memberShip',"students.email as email")
                  ->groupBy('students.id')
                  ->get();

            return $this->returnData('student', $student);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function todo($id,Request $request){
        try {
              $todo     = AssignsStudents::where('student_id',$id)->pluck('assign_id')->toArray();
              $todoList = Assigns::whereIN('id',$todo)
                          ->with('subject')->with('teacher')
                          // ->select('id','type','type_id','assigned_name','assigned_path','created_at')
                          ->paginate($request->paginate ?? 6);
             
              return response()->json([
              'status'  => true ,
              'lang'    => app()->getLocale(), 
              'todoList'=> $todoList,
              ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
     public function status($id,Request $request){
        try {
           
             $student = Student::find($id);

             if(!$student)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

             Student::where('id',$id)->update([ 
                 'status'=> $student->status == '1'? '0' : '1',
                ]);
               
            return $this -> returnSuccessMessage( __('api.Student Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
        try {
            
            Student::where('id',$id)->delete();
            StudentFamily::where('student_id',$id)->delete();

            return $this -> returnSuccessMessage( __('api.Student Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function export(Request $request) 
    {
          $name = ( $this->generate_student_code(0,1) ).'_students_'.date('Y_m_d_h_i_s').'.xlsx';
          Excel::store(new StudentsExport(), $name, 'real_public');
          return response()->json([
            'status'  => true ,
            'path'=> url('/api/'.$name)
            ] , 200);
    }
  
    public function fileImport(Request $request) 
    {

          $rules = ['file'=> 'required|mimes:xlsx,csv,xls'];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
        Excel::import(new StudentsImport($request->school_id), $request->file('file')->store('temp'));
         return $this -> returnSuccessMessage('Students Added Successfully' ,"200",200);
    }

}