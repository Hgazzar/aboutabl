<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\FileManagement;
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
use ZipArchive;

class FileManagerController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-file_managers")->only("index","show");
        $this->middleware("can:add-file_managers")->only("store","create");
        $this->middleware("can:edit-file_managers")->only("update","edit");
        $this->middleware("can:activation-file_managers")->only("status");
        $this->middleware("can:delete-file_managers")->only("destroy"); 
    }

    public function index(Request $request)
    {
             $files = FileManagement::When($request->search,function($query) use($request){
                   $query->where('name','like','%'.$request->search.'%');
              })
             ->When($request->school_id,function($query) use($request){
                   $query->where('school_id','=',$request->school_id);
              })
              ->orderBy('created_at',$request->order ?? 'desc');
            if($request->has('paginate') and $request->paginate > 0)
              $files = $files->paginate($request->paginate);
            else
              $files = $files->get();

            return response()->json([
            'status'  => true ,
            'files'   =>$files  
           ] , 200);
    }

   public function store(Request $request)
    {
        try {            
              
          $arr = ['html','css','js','json','php','sql','gz','exe','phar','txt','c#','py','c++'];

          if($request->hasFile('files'))
           {
            $files = $request->file('files');
            if(!is_array($files)) {
                $files = [$files];
            }
            
            foreach ($files as $file) {
                    $f_name   = explode('.',$file->getClientOriginalName())[0];
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $check    = FileManagement::where('name',$f_name)->where('school_id',$request->school_id)->count();
                    if($size <= 90000000 and !in_array($ext,$arr))
                    {
                       $path     = 'files_maanger';
                       $file->store('public/'.$path); 
                      
                       if($ext == 'zip')
                       {
                            $zip = new ZipArchive;
                            $res = $zip->open("storage/".$path.'/'.$hashName);
                            if ($res === TRUE) {
                            $zip->extractTo('scrom/files_maanger/'.explode('.', $hashName)[0]);
                              $zip->close();
                              $path = 'scrom/files_maanger/'.explode('.', $hashName)[0].'/index.html';
                            }
                       }
                       else
                       {
                          $path = $path.'/'.$hashName;
                       }

                       FileManagement::create([
                          'name'     => $check == 0 ? $f_name : $f_name.' copy'.$check,
                          'hashName' => $hashName,
                          'type'     => $ext,
                          'size'     => $size,
                          'path'     => $path,
                          'school_id'=> $request->school_id,
                          'created_by'  => auth()->user()->id,
                        ]);
                    }
            }
          }

          return $this -> returnSuccessMessage( __('Successfully') ,"200",200);

        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function destroy($id,Request $request)
     {
       try {
        
          $file  = FileManagement::find($id);
            
             if(!$file)
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
                  
                  FileManagement::where('id',$id)->delete();
               
                 return $this -> returnSuccessMessage( __('api.File Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}