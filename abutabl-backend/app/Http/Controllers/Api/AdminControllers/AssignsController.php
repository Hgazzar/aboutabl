<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\AssignsStudents;
use App\Models\Assigns;
use App\Models\Student;
use App\Models\Notification;
use App\Models\Token;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\LoginResource;
use App\Traits\GeneralTrait;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;

class AssignsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

     public function index(Request $request)
    {
        try {

           $assigns =  Assigns::whereIN('school_id',request()->has('school_id')?[request('school_id')]:$this->SchoolsIDs())
                            ->withCount('Students')->with('School')->get();
                 

           return response()->json([
            'status'  => true ,
            'assigns' => $assigns,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function get_module_data(Request $request)
    {
        try {            
          

            $rules = [
                "school_id"    => "required|exists:schools,id",
                "type"         => "required|in:subjects,units,lessons,lessons_contents,quizes,games",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $colms = ['subjects'=>'name_ar',
                      'units'   =>'name_ar',
                      'lessons' =>'name_ar',
                      'lessons_contents' =>'name_ar',
                      'quizes'  =>'title_ar',
                      'games'   =>'name_ar'];

            $data  = DB::table($request->type);
           if($request->type == 'subjects')
            $data = $data->whereIN('id',$this->subjects($request->school_id));
           else
            $data = $data->whereIN('subject_id',$this->subjects($request->school_id));

            $data = $data->select('id',$colms[$request->type].' as name')->get();
           return $this->returnData('data', $data);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function store(Request $request)
    {
        try {            

            $rules = [
                "school_id"    => "required|exists:schools,id",
                "grade_id"     => "nullable|array|min:1",
                "grade_id.*"   => [
                                    'exists:grades,id',
                                  ],
                "class_id"     => "nullable|array|min:1",
                "class_id.*"   => [
                                    'exists:classes,id',
                                  ],
                "student_id"   => "nullable|array",
                "student_id.*"   => [
                                    'exists:students,id',
                                  ],
                "type"         => "required|in:subjects,units,lessons,lessons_contents,quizes,games",
                "type_id"      => "required",
                "due_at"       => "nullable|date",
                "due_date"     => "nullable|date",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $dueAtInput = $request->input('due_at', $request->input('due_date'));

            if (empty($dueAtInput)) {
                return $this->returnValidationError('E001', validator([], ['due_at' => 'required'])->errors());
            }

            $dueAt = \Carbon\Carbon::parse($dueAtInput);

           if(request()->has('student_id') and !empty(request('student_id')))
           {
              $students = request('student_id');
           }
           elseif(request()->has('class_id') and !empty(request('class_id')))
           {
              $students = Student::whereIN('class_id',$request->class_id)
                ->where('status','1') 
                ->pluck('id')
                ->toArray();
           }
          else
           {
              $students = Student::whereIN('grade_id',$request->grade_id)
                ->where('status','1') 
                ->pluck('id')
                ->toArray();
           }
             DB::beginTransaction();

         // $check = Assigns::where([['type',$request->type],['type_id',$request->type_id],['school_id',$request->school_id]])->count();
         
         //  if($check > 0)
         //    return $this->returnError('E001',__('assigns already  exists'),400);
         //  else
         //  {

                   $colms = ['subjects'=>'name_ar',
                      'units'   =>'name_ar',
                      'lessons' =>'name_ar',
                      'lessons_contents' =>'name_ar',
                      'quizes'  =>'title_ar',
                      'games'   =>'name_ar'];

                   $path = [
                      'subjects'=> url('/api/subject/show/'.$request->type_id),
                      'units'         => url('/api/units/show/'.$request->type_id),
                      'lessons'       => url('/api/lessons/show/'.$request->type_id),
                      'lessons_contents' => url('/api/contents/show/'.$request->type_id),
                      'quizes'        => url('/api/quizes/show/'.$request->type_id),
                      'games'         => url('/api/games/show/'.$request->type_id),
                          ];

               $data  = DB::table($request->type)->where('id',$request->type_id)
                          ->select('id',$colms[$request->type].' as name',$request->type == 'subjects'? 'id' : 'subject_id')->first();

                if(!$data)
                {
                     return $this->returnError('E001',__('api.not_exists_item_for_this_data'));
                }

                $createdBy = request('teacher_id') ?: auth()->id();

                $assign =  Assigns::create([
                        'type'       => $request->type,
                        'type_id'    => $request->type_id,
                        'assigned_name' => $data->name,
                        'assigned_path' => $path[$request->type],
                        'school_id'  => $request->school_id,
                        'status'     => 1,
                        'created_by' => $createdBy,
                        'subject_id' => $request->type == 'subjects' ? $data->id : $data->subject_id,
                        'due_at'     => $dueAt,
                  ]);

                   foreach ($students as $student) 
                   {
                        $check = AssignsStudents::where([['type',$request->type],['type_id',$request->type_id],['student_id',$request->student_id]])->delete();
                      
                            AssignsStudents::create([
                                'assign_id'  => $assign->id,
                                'type'       => $request->type,
                                'type_id'    => $request->type_id,
                                'student_id' => $student,
                                'school_id'  => $request->school_id,
                                'status'     => 1,
                                'created_by' => $createdBy,
                          ]);


                          $dataNotify = [];
                          $dataNotify['title']      = $data->name;
                          $dataNotify['des']        = 'New Assign For '.$data->name;;
                          $dataNotify['url']        = '/todo';
                          $dataNotify['type']       = $request->type;
                          $dataNotify['type_id']    = $request->type_id;
                          $dataNotify['subject_id'] = $request->type == 'subjects' ? $data->id : $data->subject_id;

                         Notification::create([
                            'title'          => $dataNotify['title'],
                            'description'    => $dataNotify['des'],
                            'from_user_type' => "teacher",
                            'from_user_id'   => auth()->user()->id,
                            'to_user_type'   => "student",
                            'to_user_id'     => $student,
                            'url'            => $dataNotify['url'],
                            'type'           => $dataNotify['type'],
                            'type_id'        => $dataNotify['type_id'],
                         ]);
                   }
         // }

            DB::commit();

            app(PerformanceSnapshotTrigger::class)->captureStudents(
                $students,
                PerformanceSnapshotSource::ASSIGN_CREATED,
                (int) $createdBy,
                (int) $request->school_id,
                Assigns::class,
                (int) $assign->id
            );

          return $this -> returnSuccessMessage( __('Successfully') ,"200",200);

        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function destroy($id,Request $request)
     {
       try {
        
          $assign  = Assigns::find($id);
            
             if(!$assign)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

                  $affectedStudentIds = AssignsStudents::where('assign_id', $id)
                      ->pluck('student_id')
                      ->map(fn ($studentId) => (int) $studentId)
                      ->unique()
                      ->values()
                      ->all();
                  $teacherId = (int) ($assign->created_by ?? 0);
                  $schoolId = (int) ($assign->school_id ?? 0);
                  
                  Assigns::where('id',$id)->delete();
                  AssignsStudents::where('assign_id',$id)->delete();

                 // Snapshot today's metric only (fact_key uses metric_date = today).
                 // Does NOT rewrite or delete prior days' performance_facts rows.
                 app(PerformanceSnapshotTrigger::class)->captureStudents(
                     $affectedStudentIds,
                     PerformanceSnapshotSource::ASSIGN_DELETED,
                     $teacherId > 0 ? $teacherId : null,
                     $schoolId > 0 ? $schoolId : null,
                     Assigns::class,
                     (int) $id
                 );
               
                 return $this -> returnSuccessMessage( __('Assign Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}//