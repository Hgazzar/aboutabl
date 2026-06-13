<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\WorkSheets;
use App\Models\Quizes;
use App\Models\games;
use App\Models\QuizesQuestions;
use App\Models\skills;
use App\Models\SkillsSheets;
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

class WorkSheetsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-worksheets")->only("index","show");
        $this->middleware("can:add-worksheets")->only("store");
        $this->middleware("can:edit-worksheets")->only("update");
        $this->middleware("can:delete-worksheets")->only("destroy"); 
    }

   public function index(Request $request)
    {
        try {
              
                $sheets = WorkSheets::When($request->search,function($query) use($request){
                                $query->where('name_en','like','%'.$request->search.'%')
                                    ->orwhere('name_ar','like','%'.$request->search.'%');})
                                    ->pluck('id')->toArray();

                $sheets = WorkSheets::whereIN('id',$sheets)->where('subject_id',request('subject_id'))->selectRaw('id, name_en, name_ar, COALESCE(NULLIF(name_en,""), name_ar) as title, created_at, subject_id, size, ext, background, path, code');

                if($request->has('paginate') and $request->paginate > 0)
                     $sheets = $sheets->paginate($request->paginate);
                else
                     $sheets = $sheets->get();

          return response()->json([
            'status'  => true ,
            'sheets'=>$sheets,
            'local'=> app()->getLocale()
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
           
              $rules = [
                "name_en"           => ["required","string","min:2,","max:100"],
                "name_ar"           => ["required","string","min:2,","max:100"],
                "des_en"            => ["nullable","string"],
                "des_ar"            => ["nullable","string"],
                "code"              => "nullable",
                "background"        => "required|mimes:jpg,jpeg,png,gif",
                "file"              => "required",
                "subject_id"        => "required|exists:subjects,id",
                // "skills_tags"       => "nullable|array|min:1|max:10",
                // "skills_tags.*"   => [
                //           'string',
                //           'distinct', 
                //     ],
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = WorkSheets::where('subject_id',$request->subject_id);

            if($check->where('name_en',$request->name_en)->count() != 0 
            or $check->where('name_ar',$request->name_ar)->count() != 0 )
            {
                 return $this->returnError('E001','WorkSheet has already been taken');
            } 

             DB::beginTransaction();
    
          if(request()->hasFile('file') and !empty(request('file')))
           {
                    $file = request('file');
                    $arr = ['html','css','js','json','php','sql','gz','exe','phar','txt','c#','py','c++'];
                    $f_name   = explode('.',$file->getClientOriginalName())[0];
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    if($size <= 90000000 and !in_array($ext,$arr))
                    {
                       $path     = 'subjects/'.$request->subject_id.'/worksheets/files';
                       $file->store('public/'.$path); 
                      
                       if($ext == 'zip')
                       {
                            $zip = new ZipArchive;
                            $res = $zip->open("storage/".$path.'/'.$hashName);
                            if ($res === TRUE) {
                            $zip->extractTo('scrom/worksheets/'.explode('.', $hashName)[0]);
                              $zip->close();
                              $path = 'scrom/worksheets/'.explode('.', $hashName)[0].'/index.html';
                            }
                       }
                       else
                       {
                          $path = 'storage/'.$path.'/'.$hashName;
                       }
                    }
              }

           if(request()->has('background') and !empty(request('background')))
           {
                    $file     = request('background');
                    $hashName1 = $file->hashName();
                    $path1     = 'subjects/'.$request->subject_id.'/worksheets/backgrounds';
                    $file->store('public/'.$path1);
           }
              
            $sheet =  WorkSheets::create([
                      'name_en'          => $request->name_en,
                      'name_ar'          => $request->name_ar,
                      'des_en'   => $request->des_en,
                      'des_ar'   => $request->des_ar,
                      'code'              => $request->code,
                      'status'            => $request->status ?? '1',
                      'subject_id'        => $request->subject_id,
                      'created_by'        => auth()->user()->id,
                      'path'              => $path,
                      'file_name'         => $f_name,
                      'file_hash_name'    => $hashName,
                      'size'              => $size,
                      'ext'               => $ext,
                      'background'        => $path1.'/'.$hashName1,
                      'activity_lesson_id' => $request->activity_lesson_id ?? null,

                ]);
             
         if(request()->has('skills_tags') and !empty(request('skills_tags')))
           {
             $skills = [];

             foreach ($request->skills_tags as $skill)
              {
                 $check = skills::where('name',$skill)->first();

                 if(!$check)
                 {
                   $row =  skills::create([
                                   'name'       => $skill,
                                   'created_by' => auth()->user()->id, 
                                ]); 
                   $skill_id = $row->id;
                 }
                 else
                 {
                   $skill_id = $check->id;
                 }
                   SkillsSheets::create([
                     'sheet_id'   => $sheet->id,
                     'skill_id'   => $skill_id
                    ]);

              }
           }

               // if(count($skills) > 0)
               // {
               //    foreach ($skills as $skill) 
               //    {
               //      SkillsQuizes::create([
               //          'quize_id'   => $quize->id,
               //          'skill_id'  => $skill
               //      ]);
               //    }
               // }

             DB::commit();

           return $this->returnData('sheet',$sheet,'WorkSheet Added Successfully',200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function update($id , Request $request){
        try {
           
              $rules = [
                "name_en"           => ["required","string","min:2,","max:100"],
                "name_ar"           => ["required","string","min:2,","max:100"],
                "des_en"            => ["nullable","string"],
                "des_ar"            => ["nullable","string"],
                "code"              => "nullable",
                "background"        => "nullable|mimes:jpg,jpeg,png,gif",
                "file"              => "nullable",
                "subject_id"        => "nullable|exists:subjects,id",
                // "skills_tags"       => "nullable|array|min:1|max:10",
                // "skills_tags.*"   => [
                //           'string',
                //           'distinct', 
                //     ],
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $check = WorkSheets::where('subject_id',$request->subject_id)->where('id','!=',$id);

            if($check->where('name_en',$request->name_en)->count() != 0 
            or $check->where('name_ar',$request->name_ar)->count() != 0 )
            {
                 return $this->returnError('E001','WorkSheet has already been taken');
            } 

            $sheet = WorkSheets::find($id);

             DB::beginTransaction();

          if(request()->hasFile('file') and !empty(request('file')))
           {
                    $file = request('file');
                    $arr = ['html','css','js','json','php','sql','gz','exe','phar','txt','c#','py','c++'];
                    $f_name   = explode('.',$file->getClientOriginalName())[0];
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    if($size <= 90000000 and !in_array($ext,$arr))
                    {
                       $path     = 'subjects/'.$request->subject_id.'/worksheets/files';
                       $file->store('public/'.$path); 
                      
                       if($ext == 'zip')
                       {
                            $zip = new ZipArchive;
                            $res = $zip->open("storage/".$path.'/'.$hashName);
                            if ($res === TRUE) {
                            $zip->extractTo('scrom/worksheets/'.explode('.', $hashName)[0]);
                              $zip->close();
                              $path = 'scrom/worksheets/'.explode('.', $hashName)[0].'/index.html';
                            }
                       }
                       else
                       {
                          $path = 'storage/'.$path.'/'.$hashName;
                       }
                    }
                   WorkSheets::where('id',$id)->update([  
                      'path'              => $path  ,
                      'file_name'         =>  $f_name  ,
                      'file_hash_name'    =>  $hashName  ,
                      'size'              =>  $size  ,
                      'ext'               =>  $ext  ,
                  ]);
              }

           if(request()->hasFile('background') and !empty(request('background')))
           {
                    $file     = request('background');
                    $hashName1 = $file->hashName();
                    $path1     = 'subjects/'.$request->subject_id.'/worksheets/backgrounds';
                    $file->store('public/'.$path1);

                   WorkSheets::where('id',$id)->update([  
                      'background'        =>  $path1.'/'.$hashName1 ,
                  ]);
           }
                
                  
                  WorkSheets::where('id',$id)->update([
                      'name_en'          => $request->name_en,
                      'name_ar'          => $request->name_ar,
                      'des_en'            => $request->des_en,
                      'des_ar'            => $request->des_ar,
                      'code'              => $request->code,
                      'status'            => $request->status ??  $sheet->status,
                      'subject_id'        => $request->subject_id  ?? $sheet->subject_id,
                      'activity_lesson_id' => $request->activity_lesson_id ?? $sheet->activity_lesson_id,
                   ]);
             
          if(request()->has('skills_tags') and !empty(request('skills_tags')))
           {
             $skills = [];

             foreach ($request->skills_tags as $skill)
              {
                 
                $check = skills::where('name',$skill)->first();

                 if(!$check)
                 {
                   $row =  skills::create([
                                   'name'       => $skill,
                                   'created_by' => auth()->user()->id, 
                                ]); 
                   $skill_id = $row->id;
                 }
                 else
                 {
                   $skill_id = $check->id;
                 }

                 $check = SkillsSheets::where('skill_id',$skill_id)->first();
                 if(!$check)
                   SkillsSheets::create([
                     'sheet_id'   => $sheet->id,
                     'skill_id'  => $skill_id
                    ]);
                }
             }
             DB::commit();

           return $this->returnData('sheet',$sheet,'WorkSheet Added Successfully',200);

             DB::commit();

           return $this->returnData('sheet',$sheet,'WorkSheet Updated Successfully',200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


   public function show($id,Request $request)
     {
       try {

                $sheet = WorkSheets::find($id);

                if(!$sheet)
                  return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               
                  $SkillsQuizes = SkillsSheets::where('sheet_id',$id)->pluck('skill_id')->toArray();
                  $skills       = skills::whereIN('id',$SkillsQuizes)->select('id','name')->get();

                return response()->json([
                  'status'  => true ,
                  'sheet'   => $sheet,
                  'skills'  => $skills
                  ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function destroy($id,Request $request)
     {
       try {
        
          $sheet  = WorkSheets::find($id);
            
             if(!$sheet)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  WorkSheets::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( 'WorkSheet Deleted Successfully',"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}