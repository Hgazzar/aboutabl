<?php

namespace App\Http\Controllers\Api\StudentControllers\Auth;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\Notification;
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

        //try {
            $rules = [
                "code" => "required",
                "password" => "required" ,
            ];
           
            $validator = Validator::make($request->all(), $rules);


            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            
            
            //login
            $token =  Auth::guard('user-api')->attempt(['username' => $request->code , 'password' => $request->password ]);
            
            if (Auth::guard('user-api')->attempt(['username' => $request->code , 'password' => $request->password])) {
                $token =  Auth::guard('user-api')->attempt(['username' => $request->code , 'password' => $request->password]);
                $data = Student::where('id', Auth::guard('user-api')->user()->id)
                           ->with('School')->with('grade')->with('class')->first();
            } elseif (Auth::guard('user-api')->attempt(['email' => $request->code , 'password' => $request->password])) {
                $token =  Auth::guard('user-api')->attempt(['email' => $request->code , 'password' => $request->password]);
                $data = Student::where('id', Auth::guard('user-api')->user()->id)
                           ->with('School')->with('grade')->with('class')->first();
            } else {
                return $this->returnError('E001',__('api.logindatanotcorrect'),400);
            }
            
        //   if(!$token)

        //       return $this->returnError('E001',__('api.logindatanotcorrect'),400);

            
        //     $data = Student::where('id', Auth::guard('user-api')->user()->id)
        //                   ->with('School')->with('grade')->with('class')->first();

            if($data->verify == 0 or $data->status == 0)
                return $this->returnError('E001',__('api.this_account_is_not_activated'),400);

            $data->api_token = ($data->verify == 1) ? $token : null ;
            
            $user = new LoginResource($data) ;
            
            $teachers = TeachersGrades::where('grade_id',$data->grade_id)->where('class_id',$data->class_id)
                        ->where('status',1)->pluck('user_id')->toArray();
           
            foreach ($teachers as $key => $teacher) 
            {
                $des = explode(' ', $data->name)[0];
                $des = " Student ".$des." logged in ";
                // from_user_id FK references users.id only — student actors must stay null
                // until the polymorphic FK hardening ships (deferred). type/url unchanged (M8).
                Notification::create([
                  'title'          => "Login",
                  'description'    => $des,
                  'from_user_type' => "student",
                  'from_user_id'   => null,
                  'to_user_type'   => "teacher",
                  'to_user_id'     => $teacher,
                  'url'            => "/user/student/view/".$data->id,
               ]);
            }
            

            return $this -> returnData('user' , $user  , __('api.successlogin') , 200);



        // }catch (\Exception $ex){
        //     return $this->returnError($ex->getCode(), $ex->getMessage());
        // }
    }

    public function getProfile(Request $request){
        try {
            $student = Student::where('id', auth()->user()->id)
                ->with('School')
                ->with('grade')
                ->with('class')
                ->first();
            if (!$student) {
                return $this->returnError('E001', __('api.not_exists_user_for_this_data'));
            }
            $birthday = $student->birthday;
            if ($birthday instanceof \DateTimeInterface) {
                $birthday = $birthday->format('Y-m-d');
            } elseif (!is_string($birthday) || $birthday === '') {
                $birthday = '';
            }

            $photoUrl = $student->photo
                ? (str_starts_with((string) $student->photo, 'http') ? $student->photo : asset('storage/' . $student->photo))
                : null;

            $data = [
                'id'          => $student->id,
                'name'        => app()->getLocale() == 'ar' ? $student->name_ar : $student->name,
                'name_ar'     => $student->name_ar,
                'email'       => $student->email ?? '',
                'phone'       => $student->username ?? '',
                'birthday'    => $birthday,
                'gender'      => $student->gender ?? '',
                'address'     => $student->address ?? '',
                'photo'       => $photoUrl,
                'code'        => $student->memberShip ?? $student->username ?? '',
                'memberShip'  => $student->memberShip ?? $student->username ?? '',
                'school_id'   => $student->school_id,
                'school_name' => $student->school ? (app()->getLocale() == 'ar' ? $student->school->name_ar : $student->school->name) : '',
                'grade_id'    => $student->grade_id,
                'grade_name'  => $student->grade ? $student->grade->name : '',
                'class_id'    => $student->class_id,
                'class_name'  => $student->class ? $student->class->name : '',
            ];
            return $this->returnData('profile', $data, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function editProfile(Request $request){
        try {
            $rules = [
                'name'     => 'sometimes|string|max:150',
                'email'    => 'sometimes|nullable|email',
                'birthday' => 'sometimes|nullable|date',
                'gender'   => 'sometimes|nullable|string|in:male,female,Male,Female',
                'address'  => 'sometimes|nullable|string',
                'photo'    => 'sometimes|nullable|file|mimes:jpg,jpeg,png|max:5120',
            ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $student = Student::where('id', auth()->user()->id)->first();
            if (!$student) {
                return $this->returnError('E001', __('api.not_exists_user_for_this_data'));
            }

            $allowed = ['name', 'email', 'birthday', 'gender', 'address'];
            foreach ($allowed as $key) {
                if ($request->has($key)) {
                    $student->{$key} = $request->input($key) ?: null;
                }
            }

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $path = 'students';
                $file->store('public/' . $path);
                $student->photo = $path . '/' . $file->hashName();
            }

            $student->save();
            return $this->returnSuccessMessage(__('api.success'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function updatePassword(Request $request){
     try {
         $rules = [
            "password"              => "required|min:8",
            "new_password"          => "required|min:8|same:confirm_new_password",            
            "confirm_new_password"  => "required|min:8",            
           ] ;
       
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }

        $user = Student::where('id',auth()->user()->id)->first();

       if($user)
       {
            if(!Hash::check($request->password, $user->password)) 
            {
              return $this->returnError('E001',__('api.CurrentPasswordisInvalid'));
            }

            $user->verify               = 1 ;
            $user->password             = bcrypt($request->new_password) ;
            $user->save();

            auth()->logout();
            return $this -> returnSuccessMessage( __('api.password_has_changed_successfully') ,"200",200);
        }else{
            return $this->returnError('E001',__('api.not_exists_user_for_this_data'));
        }

        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function ForgetPassword(Request $request)
    {
        $rules = [
            'code'  =>  'required|exists:students,username'  
        ] ;
     
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }
        
        $user = Student::where('username',$request->code)->first();

        if($user)
        {
            // $rand = rand(1111,9999) ;
            $rand = 1234 ;
            $user->verification_code = $rand ;
            $user->verify            = 0 ;
            $user->save();
            
            return $this -> returnSuccessMessage("your code 1234" ,"200",200);
        }else{
            return $this->returnError('E001',__('api.not_exists_user_for_this_data'));
        }
    }

    public function Verification(Request $request)
    {
        try {
 
            $rules = [
                "verification_code"    => "required|digits:4|numeric|exists:students,verification_code",
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            

            $verification_code = $request->verification_code ;
            $user_id = Student::select('id')
                            ->where('verification_code',$verification_code)
                            ->first() ;
            
            if($user_id){
                $user = Student::find($user_id->id) ;
                if($user){
                    $user->verify               = 1 ; 
                    $user->status               = 1 ; 
                    $user->save();

                    // if($request->is_register == true)
                    // {
                        // $user->api_token = JWTAuth::fromUser($user);
                        // $user = new LoginResource($user) ;
                        // return $this -> returnData('user' ,$user  , __('api.successlogin') , 200);
                    // }else{
                        return $this->returnSuccessMessage( __('api.correctcode') ,"200",200) ; 
                    // }
                }else{
                    return $this->returnError('404', __('api.notcorrectcode'),200);
                }
            }else{
                return $this->returnError( '404', __('api.notcorrectcode'),200);
            }
            
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

      
     public function setPassword(Request $request)
    {
        $rules = [
            "verification_code"    => "required|digits:4|numeric|exists:students,verification_code",
            "new_password"    => "required|min:8|same:confirm_new_password"  ,
            "confirm_new_password"  => "required"  ,            
        ] ;

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }

        $user = Student::where('verification_code',$request->verification_code)
                          ->where('verify',1)->first();
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