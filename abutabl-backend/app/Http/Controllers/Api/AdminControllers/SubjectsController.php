<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Subject;
use App\Models\SubjectsClasses;
use App\Models\Grades;
use App\Models\Classes;
use App\Models\Lessons;
use App\Models\Student;
use App\Models\AssignsStudents;
use App\Models\LessonsContents;
use App\Models\Quizes;
use App\Models\Units;
use App\Models\Token;
use App\Models\subjectsSchools;
use App\Models\SubjectsGrades;
use App\Models\TeachersGrades;
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

class SubjectsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-subjects")->only("index","show");
        $this->middleware("can:add-subjects")->only("store","create");
        $this->middleware("can:edit-subjects")->only("update","edit");
        $this->middleware("can:activation-subjects")->only("status");
        $this->middleware("can:delete-subjects")->only("destroy"); 
    }

    public function index(Request $request)
    {
        try {

                 $subjects_count = Subject::whereIN('id',$this->subjects())->count();
                
                 $subjects_active = Subject::whereIN('id',$this->subjects())
                        ->where('status','1')->count();
               
                 $subjects_inactive = Subject::whereIN('id',$this->subjects())
                        ->where('status','0')->count();
                
                 $subjects_new = Subject::whereIN('id',$this->subjects())
                        ->whereMonth('created_at', now()->month)->count();
          
                 $subjects = Subject::When($request->search,function($query) use($request){
                                $query->where(function($q) use($request){
                                    $q->where('name','like','%'.$request->search.'%')
                                      ->orWhere('name_ar','like','%'.$request->search.'%');
                                });
                            });

                if(request()->has('school_id') or auth()->user()->type != 'admin')
                $subjects = $subjects->whereIN('id',$this->subjects());
                if(!request()->has('school_id') and  request('filter_status') != "")
                $subjects = $subjects->where('status',$request->filter_status);

                $subjects = $subjects
                    ->orderBy('created_at',$request->order ?? 'desc')
                    ->select('id',DB::raw("CASE WHEN lang = 'ar' THEN name_ar ELSE name END as name"),'photo')
                    ->with([
                    'subjectschool' => function ($query) {
                        $query->where('school_id', '=', request('school_id'));
                    }])
                    ->withCount('Units')
                    ->withCount('Lessons')
                    ->withCount([
                    'grades as grades' => function ($query) {
                        $query->where('school_id', '=', request('school_id'));
                    }])
                    ->withCount([
                    'teachers as teachers' => function ($query) {
                        $query->where('school_id', '=', request('school_id'));
                    }]);


                if($request->has('paginate') and $request->paginate > 0)
                   $subjects = $subjects->paginate($request->paginate);

               else
                  $subjects = $subjects->get();


           return response()->json([
            'status'  => true ,
            'subjects_count'=>$subjects_count,
            'subjects_active'=>$subjects_active,
            'subjects_inactive'=>$subjects_inactive,
            'subjects_new'=>$subjects_new,
            'subjects' => $subjects,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function subjectGrades($id , Request $request)
    {
        try { 

            $rules = [
               "school_id" => "required|exists:schools,id",
            ];
           
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

                 $subject = Subject::where('id',$id);
                 $subject_school = subjectsSchools::where('subject_id',$id)->where('school_id',$request->school_id)->first();
                 $subject_grades = SubjectsGrades::where('subjects_schools_id',$subject_school->id??0)->pluck('grade_id')->toArray();
                
                if(!$subject->first() or !$subject_school or empty($subject_grades))
                 {
                  return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                 }

                  $grade = Grades::When($request->search,function($query) use($request){
                      $query->where('name','like','%'.$request->search.'%');
                    })->whereIN('id',$subject_grades)
                    ->whereIN('status',request('status') != "" ? [request('status')] : ['1','0'])
                    ->select('id','name','status')
                    ->with([
                    'gradesubjectscholl'  => function ($query) {
                        $query->where('school_id', '=', request('school_id'));
                    }])
                    ->withCount('classes')
                    ->withCount('students');

                  if($request->has('paginate') and $request->paginate > 0)
                      $grade = $grade->paginate($request->paginate);
                  else
                      $grade = $grade->get();
                  

           return response()->json([
            'status'  => true ,
            'subject' => $subject->select('id',DB::raw("CASE WHEN lang = 'ar' THEN name_ar ELSE name END as name"),'status')->get(),
            'grade'  => $grade,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
   public function subjectUnits($id , Request $request)
    {
        try { 
             $subject = Subject::where('id',$id)->first();

                if(!$subject)
                 {
                  return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                 }

                  $units = Units::where('subject_id',$subject->id)
                    ->where('status','1')
                    ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name','name_ar as name_ar','name as name_en','type','created_at','for_teacher')
                    ->get();

                   return response()->json([
                    'status'  => true ,
                    'units'   => $units,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
  
   public function show($id,Request $request)
     {
       try {

                  $subject = Subject::where('id',$id)
                    ->select('id',DB::raw("CASE WHEN lang = 'ar' THEN name_ar ELSE name END as name"),'name as name_en','name_ar as name_ar',DB::raw("CASE WHEN lang = 'ar' THEN des_ar ELSE des END as des"),'des as des_en','lang as lang','des_ar as des_ar',DB::raw("CASE WHEN lang = 'ar' THEN pass_ar ELSE pass END as pass"),'pass as pass_en','pass_ar as pass_ar','photo','status',DB::raw('0 as videos_hours'),DB::raw('0 as articles_count'))
                    ->withCount('Lessons')
                    ->withCount('Units')
                    ->withCount('Quizes')
                    ->withCount('Games')
                    ->withCount('Resources')
                    ->withCount('WorkSheets')
                    ->get();

                  $units = Units::where('subject_id',$id)
                            ->select('units.id',app()->getLocale()=='ar'?'name as name':'name','for_teacher')
                            ->withCount('lessons')
                            ->withCount('Quizes')
                            ->with('Contents')
                            ->get();

                $quizesSubject = Quizes::where('subject_id',$id)->whereNull('unit_id')->whereNull('lesson_id')
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/quizes/show')."/' ,id) AS path"))
                        ->get();

                  $syllabus = [];

                  foreach ($units as $k => $unit) {
                    $lessons = Lessons::where('unit_id',$unit->id)->get();
                    $quizesUnit = Quizes::where('subject_id',$id)->where('unit_id',$unit->id)->whereNull('lesson_id')
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/quizes/show')."/' ,id) AS path"))
                        ->get();
                    $unit_arr = [];
                    if(count($lessons) != 0)
                    {

                      foreach ($lessons as $l => $lesson) {
                        $quizesLesson = Quizes::where('subject_id',$id)->where('unit_id',$unit->id)->where('lesson_id',$lesson->id)
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/quizes/show')."/' ,id) AS path"))
                        ->get();
                        $name =$lesson->name_en;
                        $lessons_arr = [];
                        $contents = LessonsContents::where('lesson_id',$lesson->id)->get();
                        $contents_arr = [];

                        if(count($contents) != 0)
                         {
                           foreach ($contents as $c => $content) {
                             $arr    = [];
                             $c_name = $content->name_en;
                             $arr['id'] = $content->id;
                             $arr['name'] = $c_name;
                             $arr['path'] = $content->path;
                             $arr['type'] = $content->type;
                             $arr['period'] = '1 min';
                             array_push($contents_arr, $arr);
                           }
                         }
                          $lessons_arr = ["id"=>$lesson->id,"name" => $name,"contents"=>$contents_arr,'quizesLesson'=>$quizesLesson];
                           array_push($unit_arr,$lessons_arr);
                      }
                    }
                            $unit_arr = ['id'=> $unit->id,
                                      'name'=>$unit->name,
                                      'for_teacher'=>$unit->for_teacher,
                                      'lessons_count'=>$unit->lessons_count,
                                      'quizes_count'=>$unit->quizes_count,
                                      'lessons'=>$unit_arr,
                                      'quizesUnit'  =>$quizesUnit];
                   
                           array_push($syllabus, $unit_arr);
                   
                  }

                   return  response()->json([
                    'status'     => true ,
                    'basic_info' => $subject,
                    'units'   =>$syllabus,
                    "quizesSubject"=>$quizesSubject,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  public function subjectTeachers($id , Request $request)
    {
        try { 

           $rules = [
               "school_id" => "required|exists:schools,id",
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

           $subject = Subject::where('id',$id);


          $teachers = DB::table('teachers_grades')
                    ->leftjoin('classes', 'teachers_grades.class_id', '=', 'classes.id')
                    ->leftjoin('users', 'teachers_grades.user_id', '=', 'users.id')
                    ->leftjoin('grades', 'teachers_grades.grade_id', '=', 'grades.id')
                    ->When($request->search,function($query) use($request){
                                $query->where('users.name','like','%'.$request->search.'%')
                                ->orwhere('users.name_ar','like','%'.$request->search.'%')
                                ->orwhere('classes.name','like','%'.$request->search.'%');
                            })
                    ->where('teachers_grades.school_id',$request->school_id)
                    ->where('teachers_grades.subject_id',$id)
                    ->select(app()->getLocale()=='ar'?'users.name_ar as teacher_name':'users.name as teacher_name','classes.name as class_name','grades.name as grade_name','teachers_grades.status')
                    ->orderBy('teachers_grades.created_at',$request->order ?? 'desc');

            if($request->has('paginate') and $request->paginate > 0)
                 $teachers = $teachers->paginate($request->paginate);
            else
                 $teachers = $teachers->get();
          

           return response()->json([
            'status'  => true ,
            'subject' => $subject->select('id',DB::raw("CASE WHEN lang = 'ar' THEN name_ar ELSE name END as name"),'status')->get(),
            'teachers'  => $teachers,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function SubjectStudents($id,Request $request)
    {
        try {
                $subject = Subject::where('id',$id);
               
                $subject_grades = SubjectsGrades::where('subject_id',$id)->where('school_id',$request->school_id)->pluck('grade_id')->toArray();
               
                $subject_classes=TeachersGrades::where('subject_id',$id)->where('school_id',$request->school_id)->whereIN('grade_id',$subject_grades)->pluck('class_id')->toArray();
              
                $sudentsByClasses = Student::where('school_id',$request->school_id) 
                         ->whereIN('students.class_id',$subject_classes)->pluck('id')->toArray(); 

                $sudentsByAssigns = AssignsStudents::where('type','subjects')
                                ->where('school_id',$request->school_id) 
                                ->where('type_id',$id)->pluck('student_id')->toArray(); 

                $studentsSchools  = array_merge($sudentsByClasses,$sudentsByAssigns);


           $students = DB::table('students')
                         ->whereIN('students.id',$studentsSchools) 
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
                                ->orwhere('students.username','like','%'.$request->search.'%')
                                ->orwhere('grades.name','like','%'.$request->search.'%')
                                ->orwhere('classes.name','like','%'.$request->search.'%');
                            })
                  ->orderBy('students.created_at',$request->order ?? 'desc')
                  ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name','grades.name  as grade','classes.name as class','schools.name as school','students.status','f.name as fatherName','m.name as matherName');

           if($request->has('paginate') and $request->paginate > 0)
                 $students = $students->paginate($request->paginate);
            else
                 $students = $students->get();

         return response()->json([
          'status'  => true ,
          'subject' => $subject->select('id',DB::raw("CASE WHEN lang = 'ar' THEN name_ar ELSE name END as name"),'status')->get(),
          'students'  => $students,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    public function store( Request $request)
    {
      try 
        {
            $rules = [
                "name_en"     => ["required","string","min:,","max:100"],
                "name_ar"  => ["required","string","min:,","max:100"],
                "des"      => ["nullable","string","min:10","max:1000"],
                "des_en"   => ["nullable","string","min:10","max:1000"],
                "des_ar"   => ["nullable","string","min:10","max:1000"],
                "pass"     => ["nullable","string","min:10","max:1000"],
                "pass_en"  => ["nullable","string","min:10","max:1000"],
                "pass_ar"   => ["nullable","string","min:10","max:1000"],
                "photo"    => "required",
                "lang"     => ["nullable","string","in:en,ar"],
                "school_id" => "nullable|array|min:1",
                  "school_id.*"  => [
                          'numeric',
                          'exists:schools,id',
                          'distinct', 
                    ]
            ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = Subject::where('name',$request->name_en)->orwhere('name_ar',$request->name_ar)->first();

            if ($check) {
                 return $this->returnError('E001',__('api.this_subject_alerdy_exsit'));
            }

            DB::beginTransaction();

          

           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'subjects/'.$this->userInfo()->school_id;
                    $file->store('public/'.$path);
           }
               
                 $subject  = Subject::create([
                          'name'      => $request->name_en,
                          'name_ar'   => $request->name_ar,
                          'des'       => $request->des ?? $request->des_en ?? null,
                          'des_ar'    => $request->des_ar ?? null,
                          'pass'      => $request->pass ?? $request->pass_en ?? null,
                          'pass_ar'   => $request->pass_ar ?? null,
                          'status'    => $request->status ?? 1,
                          'lang'      => $request->lang ?? 'en',
                          'photo'     => $path.'/'.$hashName,
                       ]);
            
                  if(request()->has('school_id') and !empty(request('school_id')))
                     $schools = request('school_id');
                  else
                     $schools = [$this->userInfo()->school_id];

                  foreach ($schools as $school) 
                  {
                      subjectsSchools::create([
                            'subject_id' => $subject->id,
                            'school_id'  => $school,
                      ]);
                  }
                    
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.subject_added_successfully') ,"200",200);
           
        }
       
        catch (\Exception $ex)
        {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function update($id,Request $request)
    {
      try 
        {
            $rules = [
                "name_en"     => ["required","string","min:,","max:100"],
                "name_ar"  => ["required","string","min:,","max:100"],
                "des"      => ["nullable","string","min:10","max:1000"],
                "des_en"   => ["nullable","string","min:10","max:1000"],
                "des_ar"   => ["nullable","string","min:10","max:1000"],
                "pass"     => ["nullable","string","min:10","max:1000"],
                "pass_en"  => ["nullable","string","min:10","max:1000"],
                "pass_ar"   => ["nullable","string","min:10","max:1000"],
                "photo"    => "nullable",
                "lang"     => ["nullable","string","in:en,ar"],
                "school_id" => "nullable|array|min:1",
                  "school_id.*"  => [
                          'numeric',
                          'exists:schools,id',
                          'distinct', 
                    ]
            ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = Subject::where('name',$request->name_en)
                      ->where('id','!=',$id)
                      ->first();

            $check1 = Subject::where('name_ar',$request->name_ar)
                      ->where('id','!=',$id)
                      ->first();

            if ($check or $check1) {
                 return $this->returnError('E001',__('api.this_subject_alerdy_exsit'));
            }

           $subject = Subject::find($id);

           if(!$subject)
            {
             return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
            }

            DB::beginTransaction();

          

           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'subjects/'.$this->userInfo()->school_id;
                    $file->store('public/'.$path);
                    $photoValue = $path.'/'.$hashName;
           } else {
                    // Get the raw database value (not the accessor value)
                    $rawPhoto = $subject->getOriginal('photo');
                    // If it's already a full URL, extract just the path part
                    if ($rawPhoto && (strpos($rawPhoto, 'http://') === 0 || strpos($rawPhoto, 'https://') === 0)) {
                        // Extract path after /storage/
                        $photoValue = preg_replace('#^https?://[^/]+/storage/#', '', $rawPhoto);
                    } else {
                        $photoValue = $rawPhoto;
                    }
           }
               
                 Subject::where('id',$id)->update([
                          'name'      => $request->name_en,
                          'name_ar'   => $request->name_ar,
                          'des'       => $request->des ?? $request->des_en ?? null,
                          'des_ar'    => $request->des_ar ?? null,
                          'pass'      => $request->pass ?? $request->pass_en ?? null,
                          'pass_ar'   => $request->pass_ar ?? null,
                          'status'    => $request->status,
                          'lang'      => $request->lang ?? $subject->lang ?? 'en',
                          'photo'     => $photoValue,
                       ]);
            
                  // if(request()->has('school_id') and !empty(request('school_id')))
                  //    $schools = request('school_id');
                  // else
                  //    $schools = [$this->userInfo()->school_id];

                  // subjectsSchools::where('subject_id',$subject->id)->delete();

                  // foreach ($schools as $school) 
                  // {
                  //     subjectsSchools::create([
                  //           'subject_id' => $subject->id,
                  //           'school_id'  => $school,
                  //     ]);
                  // }
                    
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.subject_updated_successfully') ,"200",200);
           
        }
       
        catch (\Exception $ex)
        {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function assignGrade($id , Request $request){
        try {

              $rules = [
                "grade_id"     => "required|array|min:1",
                "grade_id.*"  => [
                          'numeric',
                          'exists:grades,id',
                    ],
               "school_id" => "required|exists:schools,id",
            ];

            $messages = [
                'grade_id.*.numeric' => 'Each grade must be a valid grade ID (number).',
                'grade_id.*.exists'  => 'One or more selected grades do not exist.',
            ];
            $validator = Validator::make($request->all(), $rules, $messages);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $subjectSchool = subjectsSchools::where('subject_id',$id)->where('school_id',$request->school_id)->first();

             DB::beginTransaction();

               if($request->has('grade_id') and !empty($request->grade_id) and $subjectSchool)
                {
                  foreach ($request->grade_id as  $g) {
                     
                       $check = SubjectsGrades::where('school_id',$request->school_id)
                        ->where('subject_id',$id)
                        ->where('grade_id',$g)
                        ->count();

                        if($check > 0)
                         {
                          return $this->returnError('E001',"this grade was assigned for this subject before",400);
                         }

                          SubjectsGrades::create([
                                 'subjects_schools_id'=>$subjectSchool->id,
                                  'grade_id'          =>$g,
                                  'subject_id'        =>$id,
                                  'school_id'         =>$request->school_id,
                                  'status'            =>1,
                          ]); 
                      
                  }
                }      
               
            DB::commit();

                 return $this -> returnSuccessMessage( __('api.subject_updated_successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function assignTeacher(Request $request){
        try {

             $rules = [
                "subject_id"  => 'required|exists:subjects,id',
                "teacher_id"  => 'required|exists:users,id',
                "class_id"    => 'required|exists:classes,id',
                "school_id"   => 'required|exists:schools,id',
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $class = Classes::find($request->class_id);

            $check = TeachersGrades::where('school_id',$request->school_id)
                        ->where('grade_id',$class->grade_id)
                        ->where('user_id',$request->teacher_id)
                        ->where('class_id',$request->class_id);

            if($check->where('subject_id',$request->subject_id)->first())
            {
              return $this->returnError('E001',__('api.This teacher was assigned by the same subject and the same class as before'),400);
            }

            DB::beginTransaction();

            if (!empty($check->first())) 
             {
                TeachersGrades::where('school_id',$request->school_id)
                        ->where('grade_id',$class->grade_id)
                        ->where('user_id',$request->teacher_id)
                        ->where('class_id',$request->class_id)
                        ->where('id',$check->first()->id)
                        ->update([
                                'subject_id' => $request->subject_id,
                                'user_id'    => $request->teacher_id,
                                'class_id'   => $request->class_id,
                                'school_id'  => $request->school_id,
                                'grade_id'   => $class->grade_id,
                            ]);
             }
            else
             {
                TeachersGrades::create([
                                'subject_id' => $request->subject_id,
                                'user_id'    => $request->teacher_id,
                                'class_id'   => $request->class_id,
                                'school_id'  => $request->school_id,
                                'grade_id'   => $class->grade_id,    
                ]);
             }

             DB::commit();

          return $this -> returnSuccessMessage( __('api.subject_updated_successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  
    public function updateAssignTeacher($id,Request $request){
        try {

             $rules = [
                "teacher_id"  => 'required|exists:users,id',
                "class_id"    => 'required|exists:classes,id',
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             DB::beginTransaction();

             $subject = SubjectsClasses::find($id);

             if(!$subject)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
             
            
               SubjectsClasses::where('id',$id)->update([ 
                        'teacher_id'=>$request->teacher_id ?? $subject->subject_id,
                        'class_id'=>$request->class_id ?? $subject->class_id,
                        'status'=>$request->status ?? $subject->status,
                ]);
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.subject_updated_successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  public function deleteAssignTeacher($id,Request $request)
     {
       try {
        
          $subjectTeacher  = SubjectsClasses::find($id);
            
             if(!$subjectTeacher)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  SubjectsClasses::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function status($id,Request $request){
        try {
           
             DB::beginTransaction();

             $subject = Subject::where('id',$id)->first();

              if(!$subject)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

                if(!request()->has('school_id'))
                  {
                     $request->school_id;
                      Subject::where('id',$id)->update([ 
                            'status'=> $subject->status == '1'? '0' : '1',
                      ]);
                  }
               else
                  {
                   $subject_school = subjectsSchools::where('subject_id',$id)->where('school_id',$request->school_id)->first();

                     subjectsSchools::where('id',$subject_school->id)->update([ 
                            'status'=> $subject_school->status == '1'? '0' : '1',
                      ]);
                  }

              DB::commit();

           return $this -> returnSuccessMessage( __('api.subject_updated_successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
 
 public function destroy($id,Request $request){
        try {
              
               DB::beginTransaction();

              if(!request()->has('school_id'))
               {
                 Subject::where('id',$id)->delete();
               }
              else
               {
                 $subject_school = subjectsSchools::where('subject_id',$id)->where('school_id',$request->school_id)->first();

                 subjectsSchools::where('id',$subject_school->id)->delete();
                 SubjectsGrades::where('subject_id',$id)->where('school_id',$request->school_id)->delete();
               }
               
                DB::commit();

           return $this -> returnSuccessMessage( __('api.subject_deleted_successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

public function destroyAssignsSchools(Request $request){
        try {
              
               DB::beginTransaction();

                 $subject_school = subjectsSchools::where('subject_id',$request->subject_id)->where('school_id',$request->school_id)->first();

                 if($subject_school)
                 {
                   subjectsSchools::where('id',$subject_school->id)->delete();
                 }               
              DB::commit();

           return $this -> returnSuccessMessage( 'school deleted successfully' ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}