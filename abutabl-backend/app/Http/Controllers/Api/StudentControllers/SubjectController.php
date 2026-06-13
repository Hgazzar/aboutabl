<?php

namespace App\Http\Controllers\Api\StudentControllers;
use App\Models\Student;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Subject;
use App\Models\SubjectsClasses;
use App\Models\Grades;
use App\Models\Classes;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Units;
use App\Models\UnitsSchools;
use App\Models\subjectsSchools;
use App\Models\SubjectsGrades;
use App\Models\TeachersGrades;
use App\Models\games;
use App\Models\gamesStudents;
use App\Models\Quizes;
use App\Models\Questions;
use App\Models\QuizesQuestions;
use App\Models\skills;
use App\Models\SkillsQuizes;
use App\Models\AssignsStudents;
use App\Models\Assigns;
use App\Models\WorkSheets;
use App\Models\Notification;
use App\Models\StudentSubjectProgress;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use App\Http\Resources\GameStudentResource;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\questionResourceStudent;

class SubjectController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('user-api');
    }

    public function index( Request $request)
    {
      try 
        {
            $id   = auth()->user()->id; 
            $user = Student::find($id);
            if(request()->has('order') and request('order') == 'A-Z')
            {
               $sortingWay = 'ASC';  $sortingBy  = 'subjects.name';
            }
            elseif (request()->has('order') and request('order') == 'Z-A')
            {
               $sortingWay = 'DESC'; $sortingBy  = 'subjects.name'; 
            }
            else
            {
              $sortingWay = 'DESC';  $sortingBy  = 'subjects.created_at';
            }
        
         
         $subjectSchool = subjectsSchools::where('school_id',$user->school_id)->where('status','1')
                        ->pluck('id')->toArray();

         $subjectsId = DB::table('subjects_grades')->whereIN('subjects_schools_id',$subjectSchool)->where('grade_id',$user->grade_id)->where('status','1')->pluck('subject_id')->toArray();

         $subjects   = Subject::whereIN('id',$subjectsId)
                    ->where('status',1)
                    ->select(
                        'id',
                        app()->getLocale()=='ar'?'subjects.name_ar as name':'subjects.name as name',
                        'subjects.photo',
                        DB::raw('COALESCE((
                            SELECT CASE WHEN COUNT(DISTINCT g.id) = 0 THEN 0
                            ELSE LEAST(100, ROUND(100 * COUNT(DISTINCT CASE WHEN gs.status = 1 THEN g.id END) / COUNT(DISTINCT g.id)))
                            END
                            FROM games g
                            LEFT JOIN games_students gs ON g.id = gs.game_id AND gs.student_id = '.(int) $id.'
                            WHERE g.subject_id = subjects.id AND g.status = 1
                        ), 0) as progress')
                    )
                    ->withCount('lessons')
                    ->withCount('units')
                    ->orderBy($sortingBy,$sortingWay);

         if($request->has('paginate') and $request->paginate > 0)
             $subjects = $subjects->paginate($request->paginate);
         else
             $subjects = $subjects->get();

            return $this->returnData('subjects', $subjects );
        }
       
        catch (\Exception $ex)
        {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Subjects the student has fully completed (all active games marked complete in games_students).
     */
    public function earnedCertificates(Request $request)
    {
        try {
            $id = auth()->user()->id;
            $user = Student::find($id);
            if (!$user) {
                return $this->returnError('E001', __('api.not_exists_user_for_this_data'), 400);
            }

            $subjectSchool = subjectsSchools::where('school_id', $user->school_id)->where('status', '1')
                ->pluck('id')->toArray();
            $subjectsId = DB::table('subjects_grades')
                ->whereIn('subjects_schools_id', $subjectSchool)
                ->where('grade_id', $user->grade_id)
                ->where('status', '1')
                ->pluck('subject_id')
                ->toArray();

            $progressSql = 'COALESCE((
                            SELECT CASE WHEN COUNT(DISTINCT g.id) = 0 THEN 0
                            ELSE LEAST(100, ROUND(100 * COUNT(DISTINCT CASE WHEN gs.status = 1 THEN g.id END) / COUNT(DISTINCT g.id)))
                            END
                            FROM games g
                            LEFT JOIN games_students gs ON g.id = gs.game_id AND gs.student_id = '.(int) $id.'
                            WHERE g.subject_id = subjects.id AND g.status = 1
                        ), 0)';

            $earnedAtSql = 'COALESCE((
                            SELECT MAX(gs2.updated_at)
                            FROM games g2
                            INNER JOIN games_students gs2 ON g2.id = gs2.game_id AND gs2.student_id = '.(int) $id.' AND gs2.status = 1
                            WHERE g2.subject_id = subjects.id AND g2.status = 1
                        ), NULL)';

            $certificates = Subject::whereIn('id', $subjectsId)
                ->where('status', 1)
                ->select(
                    'id',
                    app()->getLocale() == 'ar' ? 'subjects.name_ar as name' : 'subjects.name as name',
                    'subjects.photo',
                    DB::raw($progressSql.' as progress'),
                    DB::raw($earnedAtSql.' as earned_at')
                )
                ->havingRaw('progress = 100')
                ->orderByDesc('earned_at')
                ->get()
                ->map(function ($row) {
                    $data = [
                        'id' => (int) $row->id,
                        'name' => $row->name,
                        'photo' => $row->photo,
                        'progress' => (int) $row->progress,
                    ];
                    if ($row->earned_at) {
                        $data['earned_at'] = \Carbon\Carbon::parse($row->earned_at)->toIso8601String();
                    } else {
                        $data['earned_at'] = null;
                    }

                    return $data;
                });

            return $this->returnData('certificates', $certificates, __('api.success'), 200);
        } catch (\Exception $ex) {
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
                    ->where('for_teacher','0')
                    ->where(function($query){
                            $query->where(function($query){
                                 $query->where('type','public');
                             })
                            ->orWhere(function($query){
                               $query->whereHas('schools', function($query) {
                                    $school_id = Student::find(auth()->user()->id)->school_id;
                                    $query->where('school_id', '=', $school_id);
                                });
                             });
                           
                         })
                    
                    ->withCount('lessons')
                    ->withCount('quizes')
                    ->with('lessons')
                    ->with('quizes')
                    ->get()
                    ->map(function ($u) 
                    { 
                         $data['id']              = $u->id ;
                         $data['name']            = app()->getLocale()=='ar'?$u->name_ar:$u->name;
                         $data['progress']        = 25 ;
                         $data['lessons_count']   = $u->lessons_count ;
                         $data['quizes_count']    = $u->quizes_count ;
                         
                         foreach ($u->lessons as $k =>  $value) {
                             $data['lessons'][$k] =  array('id'=>$value->id,'name'=>app()->getLocale()=='ar'?$value->name_ar:$value->name_en);
                         }

                         foreach ($u->quizes as $k =>  $value) {
                             $data['quizes'][$k] =  array('id'=>$value->id,'name'=>app()->getLocale()=='ar'?$value->title_ar:$value->title_en);
                         }
                         return $data;
                    });
                   return response()->json([
                    'status'  => true ,
                    'units_count' => $units->count(),
                    'units'   => $units,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
  
    public function subjectGames($id , Request $request)
    {
        try { 
           $sid = auth()->user()->id;
           $games = games::where('subject_id',$id)->where('status','1')
                        ->orderBy('created_at','desc')
                        ->select(
                            'id',
                            app()->getLocale()=='ar'?'name_ar as name':'name_en as name',
                            "background",
                            DB::raw('COALESCE((
                                SELECT 100 FROM games_students
                                WHERE games_students.game_id = games.id
                                AND games_students.student_id = '.(int) $sid.'
                                AND games_students.status = 1
                                LIMIT 1
                            ), 0) as progress')
                        )
                        ->get();

                 return response()->json([
                  'status'  => true ,
                  'games' => $games,
                  ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  public function show($id,Request $request)
     {
       try {
                  $subject = Subject::where('id',$id)
                    ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name as name',app()->getLocale()=='ar'?'des_ar as des':'des as des',app()->getLocale()=='ar'?'pass_ar as pass':'pass as pass','photo')
                    ->withCount('Lessons')
                    ->withCount('Units')
                    ->withCount('Quizes')
                    ->withCount('Games')
                    ->withCount('WorkSheets')
                    ->first();

                  $units = Units::where('subject_id',$id)
                            ->select('units.id',app()->getLocale()=='ar'?'name as name':'name','for_teacher')
                            ->withCount('lessons')
                            ->withCount('Quizes')
                            ->with('Contents')
                            ->get();

                 $quizesSubject = Quizes::where('subject_id',$id)->whereNull('unit_id')->whereNull('lesson_id')
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/student/quizes/show')."/' ,id) AS path"))->get();

                  $appRoot = rtrim(url('/'), '/');
                  $storageBase = rtrim(asset('/storage'), '/');
                  // DB path is often stored as "storage/subjects/.../file" (see WorkSheetsController); avoid /storage/storage/...
                  $worksheetFileUrlSql = "CASE WHEN path LIKE 'storage/%' "
                      . "THEN CONCAT('{$appRoot}/', path) "
                      . "ELSE CONCAT('{$storageBase}/', path) END AS file_url";

                  $worksheetsSubject = WorkSheets::where('subject_id',$id)->where('status','1')
                        ->select(
                            'id',
                            app()->getLocale()=='ar'?'name_ar as title':'name_en as title',
                            DB::raw($worksheetFileUrlSql)
                        )
                        ->get();

                  $syllabus = [];

                  foreach ($units as $k => $unit) {
                    $lessons = Lessons::where('unit_id',$unit->id)->get();

                    $quizesUnit = Quizes::where('subject_id',$id)->where('unit_id',$unit->id)->whereNull('lesson_id')
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/student/quizes/show')."/' ,id) AS path"))
                        ->get();

                    $unit_arr = [];
                    if(count($lessons) != 0)
                    {

                      foreach ($lessons as $l => $lesson) {

                       $quizesLesson = Quizes::where('subject_id',$id)->where('unit_id',$unit->id)->where('lesson_id',$lesson->id)
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/student/quizes/show')."/' ,id) AS path"))
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
                    'worksheetsSubject'=>$worksheetsSubject,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
     public function lessonView($id,Request $request)
    {
       try {

            $lesson = Lessons::where('id',$id)
                   ->where('status','1')
                   ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name_en as name','unit_id','subject_id')
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
              ->where('lessons_contents.status','1')
              ->orderBy('lessons_contents.created_at',$request->order ?? 'desc')
              ->select('lessons_contents.id','lessons_contents.name_'.app()->getLocale().' as name','lessons_contents.type','lessons_contents.created_at',DB::raw("CONCAT( '".asset('/')."' ,lessons_contents.path) AS path","lessons_contents.size"));

             if($request->paginate)
              $contents = $contents->paginate($request->paginate ?? 6);
             else
              $contents = $contents->get();

             $quizesLesson = Quizes::where('quizes.lesson_id',$lesson->id)->orderBy('quizes.created_at',$request->order ?? 'desc')
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/student/quizes/show')."/' ,id) AS path"));

             if($request->paginate)
              $quizesLesson = $quizesLesson->paginate($request->paginate ?? 6);
             else
              $quizesLesson = $quizesLesson->get();

                 $data     = Student::where('id', Auth::guard('user-api')->user()->id)->first();
                 $teachers = TeachersGrades::where('grade_id',$data->grade_id)->where('class_id',$data->class_id)
                      ->where('subject_id',$lesson->subject_id)->where('status',1)->pluck('user_id')->toArray();

                    foreach ($teachers as $key => $teacher) 
                    {
                      $des = explode(' ', $data->name)[0];
                      $des = " Student ".$des." opened the  ".$lesson->name;
                        Notification::create([
                          'title'          => "  ".$lesson->name,
                          'description'    => $des,
                          'from_user_type' => "student",
                          'from_user_id'   => $data->id,
                          'to_user_type'   => "teacher",
                          'to_user_id'     => $teacher,
                          'url'            => "subjects/scorm/".$lesson->subject_id."/".$lesson->id,
                          'type'           => 'lesson',
                          'type_id'        => $lesson->id
                       ]);
                   }

            return response()->json([
            'status'  => true,
            'lesson'=>$lesson,
            'contents'=>$contents,
            'quizes'=>$quizesLesson,
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function gamesView($id)
    {
        try { 
                 $game = games::where('id',$id)->first();
                 $game = new GameStudentResource($game) ;

                 $data     = Student::where('id', Auth::guard('user-api')->user()->id)->first();
                 $teachers = TeachersGrades::where('grade_id',$data->grade_id)->where('class_id',$data->class_id)
                      ->where('subject_id',$game->subject_id)->where('status',1)->pluck('user_id')->toArray();

                  foreach ($teachers as $key => $teacher) 
                  {
                      $des = explode(' ', $data->name)[0];
                      $des = " Student ".$des." opened the  ".$game->name_en;
                      Notification::create([
                        'title'          => "  ".$game->name_en,
                        'description'    => $des,
                        'from_user_type' => "student",
                        'from_user_id'   => $data->id,
                        'to_user_type'   => "teacher",
                        'to_user_id'     => $teacher,
                        'url'            => "subjects/GameView/".$game->id,
                        'type'           => 'game',
                        'type_id'        => $game->id
                     ]);
                   }

                 return response()->json([
                  'status'  => true ,
                  'game' => $game,
                  ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  public function quizesList($id)
  {
        $quizes = Quizes::where('subject_id',$id)
                        ->select('quizes.id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar',DB::raw("CONCAT( '".url('/api/student/quizes/show')."/' ,id) AS path"))
                        ->orderBy('lesson_id')
                        ->get();

         return  response()->json([
                    'status'  => true ,
                    'quizes'    => $quizes,
                    ] , 200);
  }

  public function quizesView($id,Request $request)
     {
       try {

                  $quize = Quizes::where('id',$id)
                    ->select('id',app()->getLocale()=='ar'?'title_ar as title':'title_en as title','title_en','title_ar','start_date as startDate','start_date','due_date as DueDate','due_date','time_limit','type_time','do_when_time_end','score_method','score_to_pass','num_attempts','code','notify_student','notify_about_submission','notify_about_late_submission','questions_per_page','navigation_method','reminder_before_due_date','subject_id');
                  $SkillsQuizes = SkillsQuizes::where('quize_id',$id)->pluck('skill_id')->toArray();
                  $skills       = skills::whereIN('id',$SkillsQuizes)->select('id','name')->get();
                  $questions    = QuizesQuestions::where('quize_id',$id)->select('question_id','score',DB::raw("CONCAT( '".$quize->first()->score_method."'  ) AS score_formate"))->get();
                  $_questions   = [];
                  foreach ($questions as $k => $qu) {
                    $row = Questions::where('id',$qu['question_id'])->with('subject')->with('lesson')->first();
                    $question['info']   = new questionResourceStudent($row) ;
                    $question['score']  = $qu['score'];
                    $question['score_formate']  = $qu['score_formate'];
                    $_questions[$k]     = $question;
                  }
                
                 $quize    = $quize->first();
                 $data     = Student::where('id', Auth::guard('user-api')->user()->id)->first();
                 $teachers = TeachersGrades::where('grade_id',$data->grade_id)->where('class_id',$data->class_id)
                      ->where('subject_id',$quize->subject_id)->where('status',1)->pluck('user_id')->toArray();

                    foreach ($teachers as $key => $teacher) 
                    {
                      $des = explode(' ', $data->name)[0];
                      $des = " Student ".$des." opened the  ".$quize->title_en;
                        Notification::create([
                          'title'          => "  ".$quize->title_en,
                          'description'    => $des,
                          'from_user_type' => "student",
                          'from_user_id'   => $data->id,
                          'to_user_type'   => "teacher",
                          'to_user_id'     => $teacher,
                          'url'            => "subjects/quiz/".$quize->id,
                          'type'           => 'quize',
                          'type_id'        => $quize->id
                       ]);
                   }


                   return  response()->json([
                    'status'  => true ,
                    'quize'    => $quize,
                    'questions'=> $_questions, 
                    'skills'   => $skills,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  /**
     * Progress overview for profile: classification (tier) + stats (assessment, subjects, questions, homework).
     */
    public function getProgressOverview(Request $request)
    {
        try {
            $studentId = auth()->user()->id;
            $user = Student::find($studentId);
            if (!$user) {
                return $this->returnError('E001', __('api.not_exists_user_for_this_data'), 400);
            }

            $subjectSchool = subjectsSchools::where('school_id', $user->school_id)->where('status', '1')
                ->pluck('id')->toArray();
            $subjectsId = DB::table('subjects_grades')
                ->whereIn('subjects_schools_id', $subjectSchool)
                ->where('grade_id', $user->grade_id)
                ->where('status', '1')
                ->pluck('subject_id')->toArray();

            $totalSubjects = count(array_unique($subjectsId));
            $progressRows = StudentSubjectProgress::where('student_id', $studentId)
                ->whereIn('subject_id', $subjectsId)
                ->get();
            $subjectsWithProgress = $progressRows->count();
            $avgProgress = $totalSubjects > 0 ? $progressRows->avg('value') : 0;
            $overallProgress = min(100, max(0, (int) round((float) $avgProgress, 0)));

            $totalQuizes = $totalSubjects > 0
                ? Quizes::whereIn('subject_id', $subjectsId)->count()
                : 0;
            $totalQuestions = $totalQuizes > 0
                ? QuizesQuestions::whereIn('quize_id', Quizes::whereIn('subject_id', $subjectsId)->pluck('id'))->count()
                : 0;

            $assignIds = array_filter(AssignsStudents::where('student_id', $studentId)->pluck('assign_id')->toArray());
            $totalHomework = !empty($assignIds) ? Assigns::whereIn('id', $assignIds)->where('status', 1)->count() : 0;

            $tier = 'Silver';
            $nextTier = 'Golden';
            if ($overallProgress < 33) {
                $tier = 'Bronze';
                $nextTier = 'Silver';
            } elseif ($overallProgress >= 66) {
                $tier = 'Golden';
                $nextTier = null;
            }

            $classification = [
                'tier'             => $tier,
                'tier_key'          => $tier === 'Bronze' ? 'Bronze-Tire' : ($tier === 'Silver' ? 'Silver-Tire' : 'Golden-Tire'),
                'description'       => $tier === 'Silver'
                    ? 'Submit on time , complete your task and homework to increase the progress'
                    : ($tier === 'Bronze' ? 'Complete subjects and assignments to reach Silver tier.' : 'You reached the Golden tier!'),
                'next_tier'         => $nextTier,
                'next_tier_message' => $nextTier ? 'Next tire is the ' . $nextTier . ' tire' : null,
                'progress_percent'  => $overallProgress,
                'badge_image'       => null,
            ];

            $stats = [
                'assessment_finished' => 0,
                'assessment_total'   => $totalQuizes,
                'subjects_finished'  => $subjectsWithProgress,
                'subjects_total'     => $totalSubjects,
                'questions_solved'   => 0,
                'questions_total'    => $totalQuestions,
                'homework_finished'  => 0,
                'homework_total'     => $totalHomework,
            ];

            return $this->returnData('progress', [
                'classification' => $classification,
                'stats'           => $stats,
            ], __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

  /**
   * Placeholder for future PDF certificate generation when subject completion rules are met.
   */
  public function certificatePreview($id, Request $request)
  {
      return response()->json([
          'status'    => true,
          'message'   => 'Certificates will be issued when you complete this subject. Full certificate download is coming soon.',
          'subject_id'=> (int) $id,
      ], 200);
  }

    /**
     * Localized subject (course) name for todo / assignment context.
     */
    protected function todoSubjectCourseName(?int $subjectId): ?string
    {
        if (! $subjectId) {
            return null;
        }
        $row = Subject::where('id', $subjectId)->first();
        if (! $row) {
            return null;
        }
        if (app()->getLocale() === 'ar') {
            return $row->name_ar ?: $row->name;
        }

        return $row->name ?: $row->name_ar;
    }

    /**
     * Localized title for the assigned item (lesson, quiz, unit, etc.).
     * Prefers resolving from type/type_id so the student locale matches the UI.
     */
    protected function todoLocalizedAssignmentTitle(?string $type, $typeId, ?string $assignedNameFallback): ?string
    {
        $typeIdInt = $typeId !== null && $typeId !== '' ? (int) $typeId : null;
        if (! $type || ! $typeIdInt) {
            return $assignedNameFallback ?: null;
        }

        $ar = app()->getLocale() === 'ar';
        $resolved = null;

        try {
            switch ($type) {
                case 'subjects':
                    $row = Subject::where('id', $typeIdInt)->first();
                    if ($row) {
                        $resolved = $ar ? ($row->name_ar ?: $row->name) : ($row->name ?: $row->name_ar);
                    }
                    break;
                case 'units':
                    $row = Units::where('id', $typeIdInt)->first();
                    if ($row) {
                        $resolved = $ar ? ($row->name_ar ?: $row->name) : ($row->name ?: $row->name_ar);
                    }
                    break;
                case 'lessons':
                    $row = Lessons::where('id', $typeIdInt)->first();
                    if ($row) {
                        $resolved = $ar ? ($row->name_ar ?: $row->name_en) : ($row->name_en ?: $row->name_ar);
                    }
                    break;
                case 'lessons_contents':
                    $row = LessonsContents::where('id', $typeIdInt)->first();
                    if ($row) {
                        $col = 'name_'.(app()->getLocale() === 'ar' ? 'ar' : 'en');
                        $resolved = $row->{$col} ?? $row->name_en ?? $row->name_ar;
                    }
                    break;
                case 'quizes':
                    $row = Quizes::where('id', $typeIdInt)->first();
                    if ($row) {
                        $resolved = $ar ? ($row->title_ar ?: $row->title_en) : ($row->title_en ?: $row->title_ar);
                    }
                    break;
                case 'games':
                    $row = games::where('id', $typeIdInt)->first();
                    if ($row) {
                        $resolved = $ar ? ($row->name_ar ?: $row->name_en) : ($row->name_en ?: $row->name_ar);
                    }
                    break;
                case 'worksheets':
                    $row = WorkSheets::where('id', $typeIdInt)->where('status', '1')->first();
                    if ($row) {
                        $resolved = $ar ? ($row->name_ar ?: $row->name_en) : ($row->name_en ?: $row->name_ar);
                    }
                    break;
                default:
                    break;
            }
        } catch (\Throwable $e) {
            $resolved = null;
        }

        return $resolved ?: ($assignedNameFallback ?: null);
    }

  public function TodoList()
    {
        try { 
               $assignStudents =  AssignsStudents::where('student_id',auth()->user()->id)->pluck('assign_id');
               $assignsToday   =  Assigns::whereIN('id',$assignStudents)->where('status','1')->orderBy('created_at','DESC');
              
              if($assignsToday->count() > 0){
               $assignsToday  = $assignsToday->get();
               $assignsTodayObjects = [];
               $i=0; $iter=0;
               $allAssigns    = [];
               $date = $assignsToday[0]['created_at'];
               $assignDB0 = \DB::table('assigns')->where('id',$assignsToday[0]['id'])->first(); 
               $allAssigns[$iter] = [];               
               $allAssigns[$iter]['date'] = date_format(date_create($assignsToday[0]['created_at']),'d-m-Y');
               $allAssigns[$iter]['data'] = [];

               foreach ($assignsToday as $key => $assign) {
                $assignDB = \DB::table('assigns')->where('id',$assign->id)->first();                
                if($date == $assign->created_at)
                {
                   $assignStudentRow = AssignsStudents::where('assign_id', $assign->id)
                       ->where('student_id', auth()->user()->id)
                       ->first();
                   $assignsTodayObjects[$i]['assign_id'] = (int) $assign->id;
                   $assignsTodayObjects[$i]['status'] = ($assignStudentRow && $assignStudentRow->opened_at)
                       ? ''
                       : 'New';
                   $assignsTodayObjects[$i]['type'] = $assign->type;
                   $assignsTodayObjects[$i]['type_id'] = $assign->type_id;
                   $assignsTodayObjects[$i]['name'] = $assign->assigned_name;
                   $assignsTodayObjects[$i]['path'] = $assign->assigned_path;
                   $assignsTodayObjects[$i]['date'] = \Carbon\Carbon::parse($assignDB->created_at)->format('d F Y - h:m A');
                   $assignsTodayObjects[$i]['due_date'] = !empty($assignDB->due_date)
                       ? \Carbon\Carbon::parse($assignDB->due_date)->format('d M Y')
                       : null;
                   $assignsTodayObjects[$i]['subject_id'] = $assign->subject_id;
                   $courseName = $this->todoSubjectCourseName((int) $assign->subject_id);
                   $assignmentTitle = $this->todoLocalizedAssignmentTitle(
                       $assign->type,
                       $assign->type_id,
                       $assign->assigned_name
                   );
                   $assignsTodayObjects[$i]['course_name'] = $courseName;
                   $assignsTodayObjects[$i]['assignment_title'] = $assignmentTitle;
                   $assignsTodayObjects[$i]['subject_name'] = $assignmentTitle ?: $courseName;
                
                   if( $assignsTodayObjects[$i]['type'] == "lessons")
                   {
                    $row = \DB::table($assign->type)->where('id',$assignsTodayObjects[$i]['type_id'])->first(); 

                    if($row)
                    {
                      $assignsTodayObjects[$i]['unit_id'] = $row->unit_id;
                    }
                   }  

                   elseif($assignsTodayObjects[$i]['type'] != "lessons" and $assignsTodayObjects[$i]['type'] != "subjects")
                   {
                    $row = \DB::table($assign->type)->where('id',$assignsTodayObjects[$i]['type_id'])->first(); 

                    if($row)
                    {
                      $assignsTodayObjects[$i]['unit_id'] = $row->unit_id??0;
                      $assignsTodayObjects[$i]['lesson_id'] = $row->lesson_id??0;
                    }
                   }  
                   $teacherUser = $assign->Teacher()->first();
                   $assignsTodayObjects[$i]['by'] = $teacherUser
                       ? ($teacherUser->name ?? $teacherUser->name_ar ?? $teacherUser->email)
                       : null;
                   $assignsTodayObjects[$i];
                   
                   if(!empty( $assignsTodayObjects[$i]))
                     array_push($allAssigns[$iter]['data'] , $assignsTodayObjects[$i]);
                   
                   $i+=1;
                }
                else
                {
                  $i=0; $iter+=1; 
                  $allAssigns[$iter] = [];
                  $allAssigns[$iter]['date'] = date_format(date_create($assignDB->created_at),'d-m-Y');
                  $allAssigns[$iter]['data'] = [];
                }
                  $date = $assign->created_at;
               }
                return response()->json([
                  'status'  => true ,
                  'allAssigns' =>  $allAssigns,
                  'temp1' =>  auth()->user()->id,
                  ] , 200);
              }
              else
              {
                return response()->json([
                  'status'  => true ,
                  'allAssigns' => [],
                  ] , 200);
              }
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Mark a todo assign as opened for the current student (clears "New" on next list fetch).
     */
    public function markTodoOpened(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assign_id' => 'required|integer|exists:assigns,id',
            ]);
            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $row = AssignsStudents::where('assign_id', (int) $request->assign_id)
                ->where('student_id', auth()->user()->id)
                ->first();

            if (! $row) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'), 404);
            }

            if (! $row->opened_at) {
                $row->opened_at = now();
                $row->save();
            }

            return response()->json([
                'status' => true,
                'msg' => __('api.success'),
            ], 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}