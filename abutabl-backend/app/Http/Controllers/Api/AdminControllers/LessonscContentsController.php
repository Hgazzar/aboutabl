<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Resources;
use App\Models\Student;
use App\Models\Classes;
use App\Models\Units;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\ConetentsSchools;
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
use Illuminate\Support\Facades\Storage;
use App\Helpers\Helper;

class LessonscContentsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-contents")->only("index","show");
        $this->middleware("can:add-contents")->only("store", "listScormDirectories");
        $this->middleware("can:edit-contents")->only("update");
        $this->middleware("can:delete-contents")->only("destroy");
    }

    public function index(Request $request)
    {

    }

    /**
     * List directories under storage/app/public/scorms for DDL SCORM selection.
     * Query: path (optional) = relative path under scorms/ to list (e.g. "folder" or "folder/sub").
     */
    public function listScormDirectories(Request $request)
    {
        try {
            $basePath = Storage::path('public/scorms');
            if (!File::isDirectory($basePath)) {
                return response()->json([
                    'status' => true,
                    'data'   => ['directories' => [], 'current_path' => '', 'parent_path' => null],
                ], 200);
            }
            $relativePath = trim(str_replace('..', '', $request->query('path', '')), '/');
            $currentPath = $relativePath ? $basePath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath) : $basePath;
            $currentPath = realpath($currentPath);
            if ($currentPath === false || strpos($currentPath, realpath($basePath)) !== 0) {
                $currentPath = $basePath;
                $relativePath = '';
            }
            $directories = [];
            $entries = File::directories($currentPath);
            foreach ($entries as $dir) {
                $name = basename($dir);
                $subRelative = $relativePath ? $relativePath . '/' . $name : $name;
                $hasEntryFile = $this->getScormEntryFileName($dir) !== null;
                $directories[] = [
                    'name'          => $name,
                    'relative_path' => $subRelative,
                    'has_entry'     => $hasEntryFile,
                ];
            }
            $parentPath = '';
            if ($relativePath !== '') {
                $parts = explode('/', $relativePath);
                array_pop($parts);
                $parentPath = implode('/', $parts);
            }
            return response()->json([
                'status' => true,
                'data'   => [
                    'directories' => $directories,
                    'current_path' => $relativePath,
                    'parent_path'  => $parentPath !== '' ? $parentPath : null,
                ],
            ], 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    private function getScormEntryFileName(string $dir): ?string
    {
        foreach (['story.html', 'index_lms.html', 'index.html'] as $fname) {
            if (file_exists($dir . DIRECTORY_SEPARATOR . $fname)) {
                return $fname;
            }
        }
        return null;
    }

    /** Accept legacy DB/API value "scrom" and canonical "scorm". */
    private function isScormContentType(?string $type): bool
    {
        return in_array($type, ['scorm', 'scrom'], true);
    }

    /** Persist as "scorm" for new/updated rows (legacy rows may still read as "scrom"). */
    private function normalizedLessonContentType(?string $type): ?string
    {
        if ($this->isScormContentType($type)) {
            return 'scorm';
        }

        return $type;
    }

    public function store( Request $request){
        try {
              $typesMimes = ["video" =>"mimetypes:video/x-ms-asf,video/x-flv,video/mp4,application/x-mpegURL,video/MP2T,video/3gpp,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/avi",
                             "word"  =>"mimes:doc,docx",
                             "powerpoints" => "mimes:ppt,pptx",
                             "excel" =>"mimes:xlx,xlsx",
                             "image" =>"mimes:jpg,bmp,jpeg,png",
                             "audio" =>"mimes:mp3",
                             "pdf"   =>"mimes:pdf",
                             "scorm" =>"mimes:zip"];

              $isDdlScorm = $request->input('source') === 'ddl' && $this->isScormContentType($request->type);

              $rules = [
                  "type"        => "required|in:video,word,powerpoints,excel,image,audio,pdf,scorm,scrom",
                  "name_en"     => ["required","string","min:2,","max:100"],
                  "name_ar"     => ["nullable","string","min:2,","max:100"],
                  "about_en"    => ["nullable","string","min:5,","max:1000"],
                  "about_ar"    => ["nullable","string","min:5,","max:1000"],
                  "status"      => "nullable|in:1,0",
                  "subject_id"  => "required|exists:subjects,id",
                  "lesson_id"   => "required|exists:lessons,id",
                  "resource_id" => "nullable|array|max:5",
                  "resource_id.*"  => [
                          'numeric',
                          'exists:resources,id',
                          'distinct', 
                    ],
                  "privacy"   => "nullable|in:private,public",
                  "school_id" => "nullable|array|min:1",
                  "school_id.*"  => [
                          'numeric',
                          'exists:schools,id',
                          'distinct', 
                    ],
               ];

              if ($isDdlScorm) {
                  $rules["source"] = "required|in:ddl";
                  $rules["scorm_directory"] = ["required", "string", "min:1", "max:500"];
              } else {
                  $mimeKey = $this->isScormContentType(request('type')) ? 'scorm' : request('type');
                  $rules["file"] = ["required","max:9000000",$typesMimes[$mimeKey]];
              }
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
              $check1 = LessonsContents::where('lesson_id',$request->lesson_id)
                       ->where('name_en',$request->name_en)
                       ->first();

              $check2 = LessonsContents::where('lesson_id',$request->lesson_id)
                       ->where('name_ar',$request->name_ar)
                       ->first();

              $lesson = Lessons::where('id',$request->lesson_id)->first();

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Content name has already been taken'));
                } 

                  DB::beginTransaction();

          $path = null;
          $size = 0;

          if ($isDdlScorm) {
              $relativePath = trim(str_replace('..', '', $request->scorm_directory), '/');
              $basePath = Storage::path('public/scorms');
              $fullPath = $relativePath ? $basePath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath) : $basePath;
              $fullPath = realpath($fullPath);
              if ($fullPath === false || strpos($fullPath, realpath($basePath)) !== 0) {
                  DB::rollBack();
                  return $this->returnError('E001', __('api.Invalid SCORM directory'));
              }
              $fname = $this->getScormEntryFileName($fullPath);
              if ($fname === null) {
                  DB::rollBack();
                  return $this->returnError('E001', __('api.Selected directory does not contain a valid SCORM entry (index.html, index_lms.html or story.html)'));
              }
              $path = 'storage/scorms/' . $relativePath . '/' . $fname;
          } elseif (request()->hasFile('file') and !empty(request('file'))) {
                    $file     = request('file');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'lessons/'.$this->userInfo()->school_id;
                    $file->store('public/'.$path); 
                    $path = '/storage/'.$path.'/'.$hashName;
          }

              $content = LessonsContents::create([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'about_en'    => $request->about_en,
                   'about_ar'    => $request->about_ar,
                   'status'      => $request->status ?? 1,
                   'lesson_id'   => $request->lesson_id,
                   'subject_id'  => $lesson->subject_id??null,
                   'unit_id'     => $lesson->unit_id??null,
                   'path'        => $path,
                   'size'        => $size,
                   'type'        => $this->normalizedLessonContentType($request->type),
                   'created_by'  => auth()->user()->id,
                   'privacy'     => $request->privacy ?? 'public',
                 ]);
                  if($this->isScormContentType(request('type')) && !$isDdlScorm && request()->hasFile('file'))
                    {
                        $zip = new ZipArchive;
                        $hashName = basename(parse_url($content->path, PHP_URL_PATH));
                        $absoluteFilePath = Storage::path('public/lessons/'.$this->userInfo()->school_id.'/'.$hashName);
                        $res = $zip->open($absoluteFilePath);
                        
                        if ($res === TRUE) {
                        $zip->extractTo(public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0]));
                          $zip->close();

                          if(file_exists(public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/story.html'))) 
                             $fname = "story.html";
                          else if(file_exists(public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/index_lms.html'))) 
                             $fname = "index_lms.html";
                          else
                             $fname = "index.html";

                          $indexPath = public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/'.$fname);
                          $indexContent = file_get_contents($indexPath);
                          $indexContent = Helper::removeScormStartOverlayScript($indexContent);
                          file_put_contents($indexPath, $indexContent);

                            LessonsContents::where('id',$content->id)->update([
                                'path' => 'scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/'.$fname
                            ]);
                        }
                    }

               ConetentsSchools::where('content_id', $content->id)->delete();

                if(request()->has('school_id') and count($request->school_id) > 0)
                 {
                      foreach ($request->school_id as $s_id)
                      {
                          ConetentsSchools::create([
                              'content_id'  => $content->id,
                              'school_id'  => $s_id,
                          ]);
                      }
                 }

          if(request()->has('resource_id') and !empty(request('resource_id')))
          {
            foreach (request('resource_id') as $k=>$f)
              {
               if(isset(request('resource_id')[$k]) and !empty(request('resource_id')[$k]))
                 {
                   $id      = request('resource_id')[$k];
                   
                   Resources::where('id',$id)->update([
                           'content_id'   => $content->id,
                           'lesson_id' => $request->lesson_id,
                           'subject_id' => $request->subject_id,
                   ]);
                         
                 }
               }
           } 


                $dataNotify = [];
                $dataNotify['title']      = $request->name_en;
                $dataNotify['des']        = 'New Content Added For '.$lesson->name_en.' Lesson';
                $dataNotify['url']        = '/learn/'.$request->subject_id.'/details/'.$content->id;
                $dataNotify['type']       = 'content';
                $dataNotify['type_id']    = $content->id;
                $dataNotify['subject_id'] = $request->subject_id;

                $this->addNotifyFromTeacher($dataNotify);

              DB::commit();
            return $this -> returnSuccessMessage( __('api.Content Added Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
        try {
              $typesMimes = ["video" =>"mimetypes:video/x-ms-asf,video/x-flv,video/mp4,application/x-mpegURL,video/MP2T,video/3gpp,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/avi",
                             "word"  =>"mimes:doc,docx",
                             "powerpoints" => "mimes:ppt,pptx",
                             "excel" =>"mimes:xlx,xlsx",
                             "image" =>"mimes:jpg,bmp,jpeg,png",
                             "audio" =>"mimes:mp3",
                             "pdf"   =>"mimes:pdf",
                             "scorm" =>"mimes:zip"];

              $rules = [
                  "type"        => "nullable|in:video,word,powerpoints,excel,image,audio,pdf,scorm,scrom",
                  "name_en"     => ["required","string","min:2,","max:100"],
                  "name_ar"     => ["nullable","string","min:2,","max:100"],
                  "about_en"    => ["nullable","string","min:5,","max:1000"],
                  "about_ar"    => ["nullable","string","min:5,","max:1000"],
                  "file"        => array_merge(
                      ["nullable", "max:9000000"],
                      request()->filled('type') && isset($typesMimes[$this->isScormContentType(request('type')) ? 'scorm' : request('type')])
                          ? [$typesMimes[$this->isScormContentType(request('type')) ? 'scorm' : request('type')]]
                          : []
                  ),
                  "status"      => "required|in:1,0",
                  "subject_id"  => "required|exists:subjects,id",
                  "lesson_id"   => "required|exists:lessons,id",
                  "resource_id" => "nullable|array|max:5",
                  "resource_id.*"  => [
                          'numeric',
                          'exists:resources,id',
                          'distinct', 
                    ],
                  "privacy"   => "nullable|in:private,public",
                  "school_id" => "nullable|array|min:1",
                  "school_id.*"  => [
                          'numeric',
                          'exists:schools,id',
                          'distinct', 
                    ],

               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
              $check1 = LessonsContents::where('lesson_id',$request->lesson_id)
                       ->where('name_en',$request->name_en)
                       ->where('id','!=',$id)
                       ->first();

              $check2 = LessonsContents::where('lesson_id',$request->lesson_id)
                       ->where('name_ar',$request->name_ar)
                       ->where('id','!=',$id)
                       ->first();

              $lesson  = Lessons::where('id',$request->lesson_id)->first();
              $content = LessonsContents::find($id);

                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Content name has already been taken'));
                } 
                 DB::beginTransaction();

           if(request()->hasFile('file') and !empty(request('file')))
           {
                    $file     = request('file');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'lessons/'.$this->userInfo()->school_id;
                    $file->store('public/'.$path); 

                   if($this->isScormContentType(request('type')))
                    {
                        $zip = new ZipArchive;
                        $absoluteFilePath = Storage::path('public/'.$path.'/'.$hashName);
                        $res = $zip->open($absoluteFilePath);
                        
                        // $res = $zip->open("storage/".$path.'/'.$hashName);
                    if ($res === TRUE) 
                      {
                         $zip->extractTo(public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0]));
                          $zip->close();

                          if(file_exists(public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/story.html'))) 
                             $fname = "story.html";
                          else if(file_exists(public_path('scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/index_lms.html'))) 
                             $fname = "index_lms.html";
                          else
                             $fname = "index.html";

                         $path = 'scrom/content/'.$content->id.'/'.explode('.', $hashName)[0].'/'.$fname;
                         $indexPath = public_path($path);
                         $indexContent = file_get_contents($indexPath);
                         $indexContent = Helper::removeScormStartOverlayScript($indexContent);
                         file_put_contents($indexPath, $indexContent);
                      }
                    }
                   else
                   {
                       $path = 'storage/lessons/'.$this->userInfo()->school_id.'/'.$hashName;
                   }

                    LessonsContents::where('id',$content->id)->update([
                      'path' => $path,
                      'size' => $size,
                      'type' => $this->normalizedLessonContentType($request->type),
                   ]);    
             }

               LessonsContents::where('id',$id)->update([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'about_en'    => $request->about_en,
                   'about_ar'    => $request->about_ar,
                   'status'      => $request->status,
                   'privacy'     => $request->privacy ?? 'public',
                 ]);
           
              ConetentsSchools::where('content_id', $content->id)->delete();

                if(request()->has('school_id') and count($request->school_id) > 0)
                 {
                      foreach ($request->school_id as $s_id)
                      {
                          ConetentsSchools::create([
                              'content_id'  => $content->id,
                              'school_id'  => $s_id,
                          ]);
                      }
                 }

          if(request()->has('resource_id') and !empty(request('resource_id')))
          {
            foreach (request('resource_id') as $k=>$f)
              {
               if(isset(request('resource_id')[$k]) and !empty(request('resource_id')[$k]))
                 {
                   $id      = request('resource_id')[$k];
                   
                   Resources::where('id',$id)->update([
                           'content_id'   => $content->id,
                           'lesson_id' => $request->lesson_id,
                           'subject_id' => $request->subject_id,
                   ]);
                         
                 }
               }
           }
          else {
              Resources::where('content_id',$content->id)->delete();
           } 
              DB::commit();
            return $this -> returnSuccessMessage( __('api.Content update Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
 

   public function show($id,Request $request)
    {
       try {

            $content = LessonsContents::where('id',$id)->with('Rescources')->with('Schools')->first();
            return response()->json([
            'status'  => true,
            'data'=>$content
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    public function destroy($id,Request $request)
     {
       try {
        
          $content  = LessonsContents::find($id);
            
             if(!$content)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  LessonsContents::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.Content Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
}