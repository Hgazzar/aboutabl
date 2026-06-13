<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Cities;
use App\Models\Governs;
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

class CitiesController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

    public function index(Request $request)
    {
        try {

            $ids     = $request->govern_id?[$request->govern_id]:Governs::where('status',1)->pluck('id')->toArray();
            
            $cities = DB::table('cities')
                    ->leftjoin('governs', 'cities.govern_id', '=', 'governs.id')                         
                    ->whereIn('cities.govern_id',$ids)
                    ->where('cities.status',1)
                    ->select('cities.id','cities.name_en as city','governs.name_en as govern') 
                    ->get();
           return $this->returnData('cities', $cities);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}