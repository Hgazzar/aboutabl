<?php

namespace App\Http\Controllers\Api;
use App\Models\User;
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

class AuthApiController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('user-api');
    }
    public function login( Request $request){

        try {
            $rules = [
                "mobile" => "required|digits:11|numeric|",
                "password" => "required" ,
            ];
            $messages = [
                'mobile.required'   => __('api.mobilerequired') , 
                'mobile.numeric'    => __('api.mustinsertmobileisnumber')     ,  
                'mobile.digits'     => __('api.mustinsertmobileisbetween9,11')     ,  
                'password.required' => __('api.passwordrequired') , 
            ];
            $validator = Validator::make($request->all(), $rules ,$messages);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            //login
            $token =  Auth::guard('user-api')->attempt(['phone' => $request->mobile , 'password' => $request->password ]);

            
           if(!$token)
               return $this->returnError('E001',__('api.logindatanotcorrect'),400);

            
            $data = Auth::guard('user-api')->user() ;

            if($data->verify == 1 && $data->status == 0)
                return $this->returnError('E001',__('api.this_account_is_not_activated'),400);

            $data->api_token = ($data->verify == 1) ? $token : null ;
            $user = new LoginResource($data) ;
             
            return $this -> returnData('user' , $user  , __('api.successlogin') , 200);

        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    
    public function register(Request $request)
    {
        try {
            $rules = [
                'name'              =>  'required|min:5'                    ,
                'phone'            =>  'required|numeric|digits:11|unique:users,phone'  ,
                'password'          =>  'required|min:6|same:confirm_password'           ,
                "confirm_password"  =>  "required"  ,         
            ] ;

            $messages = [
                'name.required'     => __('api.namerequired')                   ,
                'name.min'          => __('api.mustinsertnamemin5')             ,
                'phone.required'   => __('api.mobilerequired')                 ,  
                'phone.numeric'    => __('api.mustinsertmobileisnumber')       ,  
                'phone.unique'     => __('api.mustinsertmobileisunique')       ,  
                'phone.digits'     => __('api.mustinsertmobileisbetween9,11')  ,  
                'password.required' => __('api.passwordrequired')               ,
                'password.min'      => __('api.mustinsertpasswordmin6')         ,
                'password.same'                 => __('api.mustpasswordequalconfirm_password')       ,
                'confirm_password.required'     => __('api.mustenterconfirmpassword')       ,
            
            ];
           
                
            $validator = Validator::make($request->all(), $rules ,$messages);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            DB::beginTransaction();
            $code = 1234 ;
            $new = User::create( [
                'name'              => $request->name       ,
                'mobile'            => $request->mobile     ,
                'password'          => bcrypt($request->password) ,
                'status'            => 0  ,
                'verify'            => 0  ,
                'verification_code' => $code  ,
                'role_id'           => 2
            ] ); 

            //call api sms 
            DB::commit();

            // return $this -> returnSuccessMessage( __('api.successregister') ,"201",201);
            return $this -> returnData('user' , $new  , __('api.successlogin') , 200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}