<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\Library;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;
use App\Rules\isArabic;
use App\Rules\isEnglish;

class LibrariesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

    public function index(Request $request)
    {

           $libraries = DB::table('libraries')
                        ->leftjoin('library_files', 'library_files.library_id', '=', 'libraries.id')
                        ->When($request->search,function($query) use($request){
                            $query->where('libraries.name','like','%'.$request->search.'%');
                        })
                        ->where('libraries.subject_id',$request->subject_id) 
                        ->where('libraries.status','1') 
                        ->orderBy($request->order_by==''?'libraries.created_at':'libraries.'.$request->order_by,$request->order_type ?? 'desc')
                      ->select('libraries.id','libraries.name','libraries.created_at',DB::raw('SUM(library_files.size) as size'))
                        ->get();
            

           return response()->json([
            'status'  => true ,
            'libraries'=>$libraries,
            ] , 200); 
    }

 
}