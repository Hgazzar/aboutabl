<?php

namespace App\Http\Controllers\Api\AdminControllers\Auth;
use App\Models\User;
use App\Models\Student;
use App\Models\Notification;
use App\Models\TeachersGrades;
use App\Models\Token;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\LoginAdminResource;
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
        auth()->setDefaultDriver('admin-api');
    }
    public function login( Request $request){

        try {      
            $rules = [
                "username" => "required",
                "password" => "required" ,
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            $token =  Auth::guard('admin-api')->attempt(['username' => $request->username , 'password' => $request->password, 'status'=> 1]);

            if (Auth::guard('admin-api')->attempt(['username' => $request->username , 'password' => $request->password, 'status'=> 1])) {
                $token =  Auth::guard('admin-api')->attempt(['username' => $request->username , 'password' => $request->password, 'status'=> 1]);
                $data = Auth::guard('admin-api')->user();
            } elseif (Auth::guard('admin-api')->attempt(['email' => $request->username , 'password' => $request->password, 'status'=> 1])) {
                $token =  Auth::guard('admin-api')->attempt(['email' => $request->username , 'password' => $request->password, 'status'=> 1]);
                $data = Auth::guard('admin-api')->user();
            } else {
                $studentPortal = $this->attemptStudentPortalLogin($request->username, $request->password);
                if ($studentPortal !== null) {
                    return $studentPortal;
                }
                return $this->returnError('E001',__('api.logindatanotcorrect'),400);
            }
            
        //   if(!$token) {
        //       return $this->returnError('E001',__('api.logindatanotcorrect'),400);
        //   } else {
               
        //   }
            

            
            // $data = Auth::guard('admin-api')->user() ;

            $roleOk = optional($data->roles->first())->status == 1;
            if ($data->verify != 1 || $data->status != 1 || ! $roleOk) {
                return $this->returnError('E001', __('api.this_account_is_not_activated'), 400);
            }


            $data->api_token   = ($data->verify == 1) ? $token : null ;
            $data->num_school  = !empty($this->Schools())?count($this->Schools()):0;
            $data->role_id     = $this->userInfo()->role->id??0;
            $data->role_name   = $this->userInfo()->role->name??'';
            $data->school      = $this->Schools();
            $user = new LoginAdminResource($data) ;
             
            return $this -> returnData('user' , $user  , __('api.successlogin') , 200);

        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Student app uses the same credentials against the students table (user-api guard).
     * Returns a JSON response when this is a successful student login, null when not a student.
     */
    private function attemptStudentPortalLogin(string $identifier, string $password): ?\Illuminate\Http\JsonResponse
    {
        auth()->setDefaultDriver('user-api');

        $data = null;
        $token = null;

        if (Auth::guard('user-api')->attempt(['username' => $identifier, 'password' => $password])) {
            $token = Auth::guard('user-api')->attempt(['username' => $identifier, 'password' => $password]);
            $data = Student::where('id', Auth::guard('user-api')->user()->id)
                ->with('School')->with('grade')->with('class')->first();
        } elseif (Auth::guard('user-api')->attempt(['email' => $identifier, 'password' => $password])) {
            $token = Auth::guard('user-api')->attempt(['email' => $identifier, 'password' => $password]);
            $data = Student::where('id', Auth::guard('user-api')->user()->id)
                ->with('School')->with('grade')->with('class')->first();
        }

        auth()->setDefaultDriver('admin-api');

        if ($data === null) {
            return null;
        }

        if ($data->verify == 0 || $data->status == 0) {
            return $this->returnError('E001', __('api.this_account_is_not_activated'), 400);
        }

        $data->api_token = ($data->verify == 1) ? $token : null;

        $teachers = TeachersGrades::where('grade_id', $data->grade_id)->where('class_id', $data->class_id)
            ->where('status', 1)->pluck('user_id')->toArray();

        foreach ($teachers as $teacher) {
            $des = explode(' ', $data->name)[0];
            $des = ' Student '.$des.' logged in ';
            Notification::create([
                'title' => 'Login',
                'description' => $des,
                'from_user_type' => 'student',
                'from_user_id' => $data->id,
                'to_user_type' => 'teacher',
                'to_user_id' => $teacher,
                'url' => 'user/student/view/'.$data->id,
            ]);
        }

        $user = new LoginResource($data);

        return response()->json([
            'status' => true,
            'errNum' => '200',
            'msg' => __('api.successlogin'),
            'user' => $user,
            'portal' => 'student',
        ], 200);
    }

    public function ForgetPassword(Request $request)
    {
        $rules = [
            'email'  =>  'required|email|exists:users,email'  
        ] ;
     
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }
        
        $user = User::where('email',$request->email)->first();

        if($user)
        {
            // $rand = rand(1111,9999) ;
            $rand = 1234 ;
            $user->verification_code = $rand ;
            // $user->verify            = 1 ;
            $user->save();
            
            return $this -> returnSuccessMessage( __('api.key_forget_password') ,"200",200);
        }else{
            return $this->returnError('E001',__('api.not_exists_user_for_this_data'));
        }
    }

    public function Verification(Request $request)
    {
        try {
 
            $rules = [
                "verification_code"    => "required|digits:4|numeric|exists:users,verification_code",
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            DB::beginTransaction();

            $verification_code = $request->verification_code ;
            $user_id = User::select('id')
                            ->where('verification_code',$verification_code)
                            ->where('verify',0)
                            ->first() ;
            
            if($user_id){
                $user = User::find($user_id->id) ;
                if($user){
                    // $user->verification_code    = NULL ;
                    $user->verify               = 1 ; 
                    $user->status               = 1 ; 
                    $user->save();

                    DB::commit();
                    // if($request->is_register == true)
                    // {
                        // $user->api_token = JWTAuth::fromUser($user);
                        // $user = new LoginResource($user) ;
                        // return $this -> returnData('user' ,$user  , __('api.successlogin') , 200);
                    // }else{
                        return $this->returnSuccessMessage( __('api.correctcode') ,"200",200) ; 
                    // }
                }else{
                    return $this->returnError('404', __('api.thisemailnotcorrect'),200);
                }
            }else{
                return $this->returnError( '404', __('api.thisemailnotcorrect'),200);
            }
            
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

      
     public function setPassword(Request $request)
    {
        $rules = [
            "verification_code"    => "required|digits:4|numeric|exists:users,verification_code",
            "new_password"    => "required|min:8"  ,
            "confirm_new_password"  =>  'required_with:new_password|same:new_password'  ,            
        ] ;

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }

        $user = User::where('verification_code',$request->verification_code)->first();
        if($user)
        {

            $user->verification_code    = null ;
            $user->verify               = 1 ;
            $user->password             = bcrypt($request->new_password) ;
            $user->save();

            return $this -> returnSuccessMessage( __('api.password_has_changed_successfully') ,"200",200);
        }else{
            return $this->returnError('E001',__('api.not_exists_user_for_this_data'));
        }
    }

    public function logout(Request $request)
    {
        try {
            auth()->logout();
            return $this->returnSuccessMessage( __('api.successlogout') ,201) ;
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}