<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
use App\Models\games;
use App\Models\gamesStudents;
use App\Models\skills;
use App\Models\SkillsGames;
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
use ZipArchive;
use App\Helpers\Helper;

class GamesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-games")->only("index","show");
        $this->middleware("can:add-games")->only("store","create");
        $this->middleware("can:edit-games")->only("update","edit");
        $this->middleware("can:activation-games")->only("status");
        $this->middleware("can:delete-games")->only("destroy"); 
    }

     public function index(Request $request)
    {
        try { 
                 $games = games::When($request->search,function($query) use($request){
                                $query->where('name_ar','like','%'.$request->search.'%')
                                      ->orwhere('name_en','like','%'.$request->search.'%');
                            })->pluck('id')->toArray();

                $games = games::with(['questions'])->whereIN('id',$games)->where('subject_id',$request->subject_id ?? 0) 
                    ->orderBy('created_at',$request->order ?? 'desc')
                    ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name_en as name',"background","path",DB::raw("0 AS progress"))
                    ->paginate($request->paginate ?? 8);

                 return response()->json([
                  'status'  => true ,
                  'games' => $games,
                  ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name_en"     => ["required","","string","min:2,","max:100"],
                "name_ar"     => ["required","string","min:2,","max:100"],
                "des_en"      => ["nullable","string","min:5,","max:1000"],
                "des_ar"      => ["nullable","string","min:5,","max:1000"],
                "background"  => "required|mimes:jpg,jpeg,png,gif",
                "file"        => "required|mimes:zip,max:90000000",
                "code"        => "nullable",
                "skills_tags" => "nullable|array|min:1|max:10",
                "status"      => "nullable|in:1,0",
                "subject_id"    => "required|exists:subjects,id",
                // "classes_id"    => "required|array|min:1|max:5",
                // "classes_id.*"  => [
                //           'exists:classes,id',
                //           'distinct', 
                //     ],
                // "students_id"    => "nullable|array|min:1",
                // "students_id.*"  => [
                //           'exists:students,id',
                //           'distinct', 
                //     ],
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check1 = games::where('name_ar',$request->name_ar)->where('subject_id',$request->subject_id)->count();
            $check2 = games::where('name_en',$request->name_en)->where('subject_id',$request->subject_id)->count();
            if($check1 >0 and $check2 > 0)
            {
                return $this->returnError('E001',__('api.This game already exists'),400);
            }

             DB::beginTransaction();

          if(request()->has('background') and !empty(request('background')))
           {
                    $file     = request('background');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'subjects/'.$request->subject_id.'/games/backgrounds';
                    $file->store('public/'.$path);
           }

         if(request()->has('file') and !empty(request('file')))
           {
                    $file1     = request('file');
                    $f_name1   = $file1->getClientOriginalName();
                    $hashName1 = $file1->hashName();
                    $size1     = $file1->getSize();
                    $ext1      = $file1->extension();
                    $path1     = 'subjects/'.$request->subject_id.'/games/files';
                    $file1->store('public/'.$path1);
           }

          $skills = [];

          if(request()->has('skills_tags') and !empty(request('skills_tags')))
           {
           
             foreach ($request->skills_tags as $skill)
              {
                 $check = skills::where('name',$skill)->first();

                 if(!$check)
                 {
                   $row =  skills::create([
                                   'name'       => $skill,
                                   'created_by' => auth()->user()->id, 
                                ]); 

                    array_push($skills,$row->id);  
                 }
                 else
                 {
                    array_push($skills,$check->id);
                 }
              }
           }
              
               $game =  games::create([
                      'name_en'    => $request->name_en,
                      'name_ar'    => $request->name_ar,
                      'des_en'     => $request->des_en,
                      'des_ar'     => $request->des_ar,
                      'background' => $path.'/'.$hashName,
                      'path'       => $path1.'/'.$hashName1,
                      'ext'        => $ext1,
                      'size'       => $size1,
                      'code'       => $request->code,
                      'status'     => $request->status ?? '1',
                      'subject_id' => $request->subject_id,
                      'activity_lesson_id' => $request->activity_lesson_id ?? null,
                      'created_by' => auth()->user()->id,
                ]);
              
                        $zip = new ZipArchive;
                        $res = $zip->open("storage/".$path1.'/'.$hashName1);
                        if ($res === TRUE) {
                        $zip->extractTo('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0]);
                          $zip->close();

                         if(file_exists(public_path('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/story.html'))) 
                             $fname = "story.html";
                          elseif(file_exists(public_path('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/index_lms.html'))) 
                             $fname = "index_lms.html";
                          else
                             $fname = "index.html";

                          $indexPath = public_path('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/'.$fname);
                          $indexContent = file_get_contents($indexPath);
                          $indexContent = Helper::removeScormStartOverlayScript($indexContent);
                          file_put_contents($indexPath, $indexContent);

                          games::where('id',$game->id)->update([
                              'path' => 'scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/'.$fname
                          ]);
                        }

               if(count($skills) > 0)
               {
                  foreach ($skills as $skill) 
                  {
                    SkillsGames::create([
                        'game_id'   => $game->id,
                        'skill_id'  => $skill
                    ]);
                  }
               }

         if ($request->has('students_id') && !empty($request->students_id)) {
             foreach ($request->students_id as $studentId) {
                 $student = Student::where('id', $studentId)->where('status', '1')->first();
                 if ($student) {
                     gamesStudents::firstOrCreate(
                         [
                             'student_id' => $student->id,
                             'game_id'    => $game->id,
                         ],
                         [
                             'class_id' => $student->class_id,
                             'status'   => '1',
                         ]
                     );
                 }
             }
         } elseif ($request->has('classes_id') && !empty($request->classes_id)) {
             foreach ($request->classes_id as $classId) {
                 $students = Student::where('class_id', $classId)->where('status', '1')->get();
                 foreach ($students as $student) {
                     gamesStudents::firstOrCreate(
                         [
                             'student_id' => $student->id,
                             'game_id'    => $game->id,
                         ],
                         [
                             'class_id' => $student->class_id,
                             'status'   => '1',
                         ]
                     );
                 }
             }
         }

                $dataNotify = [];
                $dataNotify['title']      = $request->name_en;
                $dataNotify['des']        = 'New game added';
                $dataNotify['url']        = '/learn/'.$request->subject_id.'/detailsGame/'.$game->id;
                $dataNotify['type']       = 'game';
                $dataNotify['type_id']    = $game->id;
                $dataNotify['subject_id'] = $request->subject_id;

                $this->addNotifyFromTeacher($dataNotify);
              
             DB::commit();

            return $this->returnData('game',games::find($game->id), __('api.Game Added Successfully') ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
       public function update($id,Request $request){
        try {
           
              $rules = [
                "name_en"     => ["required","","string","min:2,","max:100"],
                "name_ar"     => ["required","string","min:2,","max:100"],
                "des_en"      => ["nullable","string","min:5,","max:1000"],
                "des_ar"      => ["nullable","string","min:5,","max:1000"],
                "background"  => "nullable|mimes:jpg,jpeg,png,gif",
                "file"        => "nullable|mimes:zip,max:90000000",
                "code"        => "nullable",
                "skills_tags" => "nullable|array|min:1|max:10",
                "status"      => "required|in:1,0",
                "subject_id"    => "required|exists:subjects,id",
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check1 = games::where('name_ar',$request->name_ar)->where('subject_id',$request->subject_id)
                        ->where('id','!=',$id)->count();
            $check2 = games::where('name_en',$request->name_en)->where('subject_id',$request->subject_id)
                        ->where('id','!=',$id)->count();
            if($check1 >0 and $check2 > 0)
            {
                return $this->returnError('E001',__('api.This game already exists'),400);
            }

             DB::beginTransaction();

               $game  = games::find($id);
           
                games::where('id',$id)->update([
                      'name_en'    => $request->name_en,
                      'name_ar'    => $request->name_ar,
                      'des_en'     => $request->des_en,
                      'des_ar'     => $request->des_ar,
                      'code'       => $request->code,
                      'status'     => $request->status,
                      'subject_id' => $request->subject_id,
                      'activity_lesson_id' => $request->activity_lesson_id ?? null,
                ]);


          if(request()->has('background') and !empty(request('background')))
           {
                    $file     = request('background');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'subjects/'.$request->subject_id.'/games/backgrounds';
                    $file->store('public/'.$path);

                     games::where('id',$id)->update([
                     'background' => $path.'/'.$hashName,
                    ]);
           }

         if(request()->has('file') and !empty(request('file')))
           {
                    $file1     = request('file');
                    $f_name1   = $file1->getClientOriginalName();
                    $hashName1 = $file1->hashName();
                    $size1     = $file1->getSize();
                    $ext1      = $file1->extension();
                    $path1     = 'subjects/'.$request->subject_id.'/games/files';
                    $file1->store('public/'.$path1);

                   games::where('id',$id)->update([
                      'ext'        => $ext1,
                      'size'       => $size1,
                      'path' => $path1.'/'.$hashName1,
                    ]);
           }

          $skills = [];

          if(request()->has('skills_tags') and !empty(request('skills_tags')))
           {
             foreach ($request->skills_tags as $skill)
              {
                 $check = skills::where('name',$skill)->first();

                 if(!$check)
                 {
                   $row =  skills::create([
                                   'name'       => $skill,
                                   'created_by' => auth()->user()->id, 
                                ]); 

                    array_push($skills,$row->id);  
                 }
                 else
                 {
                    array_push($skills,$check->id);
                 }
              }
           }
              

          
              if(request()->has('file') and !empty(request('file')))
              {
                        $zip = new ZipArchive;
                        $res = $zip->open("storage/".$path1.'/'.$hashName1);
                        if ($res === TRUE) {
                        $zip->extractTo('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0]);
                          $zip->close();

                          if(file_exists(public_path('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/story.html'))) 
                             $fname = "story.html";
                          elseif(file_exists(public_path('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/index_lms.html'))) 
                             $fname = "index_lms.html";
                          else
                             $fname = "index.html";

                          $indexPath = public_path('scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/'.$fname);
                          $indexContent = file_get_contents($indexPath);
                          $indexContent = Helper::removeScormStartOverlayScript($indexContent);
                          file_put_contents($indexPath, $indexContent);

                          games::where('id',$game->id)->update([
                              'path' => 'scrom/games/'.$game->id.'/'.explode('.', $hashName1)[0].'/'.$fname
                          ]);
                        }
              }

              SkillsGames::where('game_id',$id)->delete();

               if(count($skills) > 0)
               {
                  foreach ($skills as $skill) 
                  {
                    SkillsGames::create([
                        'game_id'   => $game->id,
                        'skill_id'  => $skill
                    ]);
                  }
               }

             DB::commit();

            return $this->returnData('game',games::find($game->id), __('api.Game Updated Successfully') ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
  
   public function show($id)
    {
        try { 
                 $game       = games::where('id',$id)->get();
                 $skillsTags = SkillsGames::where('game_id',$id)->get();
                 $skills     = [];
                 if(!empty($skillsTags)){
                  foreach ($skillsTags as $key => $skill) {
                    $row = skills::find($skill->skill_id);
                    if($row){
                     $skills[$key]['id']   = $row->id;
                     $skills[$key]['name'] = $row->name;
                    }
                   }
                 }
                 return response()->json([
                  'status'  => true ,
                  'game' => $game,
                  'skillsTags' => $skills
                  ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function destroy($id,Request $request)
     {
       try {
        
          $game  = games::find($id);
            
             if(!$game)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                 
                  File::delete($game->path);
                  games::where('id',$id)->delete();
                
                return $this -> returnSuccessMessage( __('api.Game Deleted Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}