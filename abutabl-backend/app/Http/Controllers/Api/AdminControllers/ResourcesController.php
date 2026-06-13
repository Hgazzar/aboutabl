<?php
namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Grades;
use App\Models\Student;
use App\Models\Classes;
use App\Models\ResourcesFiles;
use App\Models\Lessons;
use App\Models\Resources;
use App\Models\LibraryFiles;
use App\Models\Library;
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

class ResourcesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

    public function index(Request $request)
    {

    }

    public function store(Request $request){
        try {
          
          if($request->type == 'upload')
          {
          	$rules = [
                "name"     => ["required","string","min:2,","max:100"],
                "add_to_library" => ["nullable","in:1,0"],
                "files" => "nullable|array|min:1|max:4",
                "files.*"  => [
                        'mimes:jpg,jpeg,png,gif,pdf,txt,word,video/mp4,doc,docx,ppt,pptx,xlx,xlsx,mp3',
                        'max:1024',
                        'distinct', 
                  ]
               ];
            
	            $validator = Validator::make($request->all(), $rules);

	            if ($validator->fails()) {
	                $code = $this->returnCodeAccordingToInput($validator);
	                return $this->returnValidationError($code, $validator);
	            }	

	            DB::beginTransaction();

	          $resource = Resources::create([
                   'name'       => $request->name,
                   'created_by' => auth()->user()->id,
                   'status'     => 1,
                   'type'       => $request->type,
                 ]);
	        
	         if($request->add_to_library == '1')
                {
                  $library_id = Library::create([
                   'name'       => $request->name,
                   'created_by' => auth()->user()->id,
                   'status'     => 1,
                  ]);
                }

	         foreach (request('files') as $k=>$f)
              {
               if(isset(request('files')[$k]) and !empty(request('files')[$k]))
                 {
                    $file     = request('files')[$k];
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'resources/'.$this->userInfo()->school_id;
                    $file->store('public/'.$path);

                    ResourcesFiles::create([
                        'path'         => $path.'/'.$hashName,
                        'size'         => $size,
                        'ext'          => $ext,
                        'resource_id'  => $resource->id,
                    ]);

                   if($request->add_to_library == '1')
                    {
                      LibraryFiles::create([
 					            	'path'         => $path.'/'.$hashName,
                        'size'         => $size,
                        'ext'          => $ext,
                        'library_id'   => $library_id->id,
                      ]);
                    }
                 }
               }

                 $resource = DB::table('resources')
                        ->leftjoin('resources_files', 'resources_files.resource_id', '=', 'resources.id')
                        ->where('resources.id',$resource->id) 
                        ->select('resources.id','resources.name','resources.created_at',DB::raw('SUM(resources_files.size) as size'))
                        ->get();            

                  DB::commit();

		           return response()->json([
		            'status'  => true ,
		            'resource'=>$resource,
		            ] , 200); 

             

          } 


         if($request->type == 'external_link')
          {
          	$rules = [
                "name"     => ["required","string","min:2,","max:100"],
                "add_to_library" => ["nullable","in:1,0"],
                "url" => "nullable|url",
               ];
            
	            $validator = Validator::make($request->all(), $rules);

	            if ($validator->fails()) {
	                $code = $this->returnCodeAccordingToInput($validator);
	                return $this->returnValidationError($code, $validator);
	            }	

	            DB::beginTransaction();

	          $resource = Resources::create([
                   'name'       => $request->name,
                   'created_by' => auth()->user()->id,
                   'status'     => 1,
                   'type'       => $request->type,
                 ]);
	        
	         if($request->add_to_library == '1')
                {
                  $library_id = Library::create([
                   'name'       => $request->name,
                   'created_by' => auth()->user()->id,
                   'status'     => 1,
                  ]);
                }

	              ResourcesFiles::create([
                        'path'         => $request->url,
                        'size'         => 1,
                        'ext'          => '',
                        'resource_id'  => $resource->id,
                    ]);

                   if($request->add_to_library == '1')
                    {
                      LibraryFiles::create([
 						            'path'         => $request->url,
                        'size'         => 1,
                        'ext'          => '',
                        'library_id'   => $library_id->id,
                      ]);
                    }

                    $resource = DB::table('resources')
                        ->leftjoin('resources_files', 'resources_files.resource_id', '=', 'resources.id')
                        ->where('resources.id',$resource->id) 
                        ->select('resources.id','resources.name','resources.created_at',DB::raw('SUM(resources_files.size) as size'))
                        ->get();            

                DB::commit();

		           return response()->json([
		            'status'  => true ,
		            'resource'=>$resource,
		            ] , 200); 

                
         	 } 

        if($request->type == 'library')
          {
          	$rules = [
                "library_id" => "required|array|min:1|max:5",
                "library_id.*"  => [
                        'numeric',
                        'exists:libraries,id',
                        'distinct', 
                  ]
               ];
            
	            $validator = Validator::make($request->all(), $rules);

	            if ($validator->fails()) {
	                $code = $this->returnCodeAccordingToInput($validator);
	                return $this->returnValidationError($code, $validator);
	            }	

	            $ids = [];

	         foreach (request('library_id') as $k=>$f)
              {
               if(isset(request('library_id')[$k]) and !empty(request('library_id')[$k]))
                 {
                   $id      = request('library_id')[$k];
                   $library = Library::find($id);
                   $library_files = LibraryFiles::where('library_id',$id)->get();

                   DB::beginTransaction();

                   $resource =  Resources::create([
	                   'name'       => $library->name,
	                   'created_by' => auth()->user()->id,
	                   'status'     => 1,
	                   'type'       => $request->type,
	                 ]);

                   array_push($ids,$resource->id);

	              		 foreach ($library_files as $v)
	              		 {
	              		 	 ResourcesFiles::create([
			                        'path'         => $v->path,
			                        'size'         => $v->size,
			                        'ext'          => $v->ext,
			                        'resource_id'  => $resource->id,
			                    ]);
	              		 }   
                 }
               }
                 $resource = DB::table('resources')
                        ->whereIN('resources.id',$ids) 
                        ->select('resources.id','resources.name','resources.created_at')
                        ->get();            
               
               DB::commit();  

		           return response()->json([
		            'status'  => true ,
		            'resource'=>$resource,
		            ] , 200); 

           } 
                                
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
               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
              $lesson  = Lessons::find($id);
             if(!$lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);

              $check1 = Lessons::where([['subject_id',$lesson->subject_id],['id','!=',$id]])
                       ->where('name_en',$request->name)
                       ->first();

              $check2 = Lessons::where([['subject_id',$lesson->subject_id],['id','!=',$id]])
                       ->where('name_ar',$request->name_ar)
                       ->first();


                if($check1 or $check2)
                {
                     return $this->returnError('E001',__('api.Unit name has already been taken'));
                } 

                 Lessons::where('id',$id)->update([
                   'name_en'     => $request->name_en,
                   'name_ar'     => $request->name_ar,
                   'status'      => $request->status ??$unit->lesson,
                 ]);
            
              return $this -> returnSuccessMessage( __('api.Lessons Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id,Request $request)
    {
         try {

        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
     
    public function status($id,Request $request)
     {
        try {
             $lesson = Lessons::find($id);

             if(!$lesson)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
         
              Lessons::where('id',$id)->update([  
                    'status'=>  $lesson->status == '1'? '0' : '1',
                ]);
               
               return $this -> returnSuccessMessage( __('api.Lesson Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request)
     {
       try {
        
          $lesson  = Lessons::find($id);
            
             if(!$lesson)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  LessonsContents::where('lesson_id',$id)->delete();
                  Lessons::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.Lesson Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}