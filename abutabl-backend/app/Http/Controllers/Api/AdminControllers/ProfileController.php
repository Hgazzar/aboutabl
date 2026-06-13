<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\StudentFamily;
use App\Models\SchoolsRoles;
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

class ProfileController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

    public function prfile(Request $request)
    {
        try {
             
           $userInfo = DB::table('users')
                  ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                  ->where('users.id',$this->userInfo()->id)
                  ->select('users.id','users.name as name_en','users.name_ar as name_ar','users.username','users.birthday','users.email','users.phone','users.gender','users.specialize','users.specialize_ar','users.status','users.joining_date','users.address as address_en','users.address_ar as address_ar',DB::raw("CONCAT( '".asset('/storage')."/' , users.photo) AS photo"))
                  ->get();

           $userPermissions =  Role::find($this->userInfo()->role_id)->getAllPermissions()->map(function ($event) {
                        return [
                            'id'    => $event->id,
                            'name'  => $event->name,
                        ];
                    });;

           return response()->json([
            'status'  => true ,
            'userInfo' => $userInfo,
            'roleType' => ['id'    =>$this->userInfo()->role->id,
                           'name'  =>$this->userInfo()->role->name],
            'permissions' => $userPermissions,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Update the authenticated user's own profile (no role/permissions).
     */
    public function update(Request $request)
    {
        try {
            $rules = [
                'full_name_en' => 'required|string|min:2|max:255',
                'full_name_ar' => 'required|string|min:2|max:255',
                'username'     => 'required|string|unique:users,username,' . $this->userInfo()->id,
                'email'        => 'required|email|unique:users,email,' . $this->userInfo()->id,
                'phone'        => 'required|string|unique:users,phone,' . $this->userInfo()->id,
                'password'     => 'nullable|string|min:8',
                'birthday'     => 'nullable|date_format:Y-m-d',
                'gender'       => 'nullable|in:male,female',
                'specialization_en' => 'nullable|string|max:255',
                'specialization_ar' => 'nullable|string|max:255',
                'address_en'   => 'nullable|string|max:1000',
                'address_ar'   => 'nullable|string|max:1000',
                'photo'        => 'nullable|mimes:jpg,jpeg,png|max:5120',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $user = $this->userInfo();
            $update = [
                'name'       => $request->full_name_en,
                'name_ar'    => $request->full_name_ar,
                'username'   => $request->username,
                'email'      => $request->email,
                'phone'      => $request->phone,
                'birthday'   => $request->birthday ?? $user->birthday,
                'gender'     => $request->gender ?? $user->gender,
                'specialize' => $request->specialization_en ?? $user->specialize,
                'specialize_ar' => $request->specialization_ar ?? $user->specialize_ar,
                'address'    => $request->address_en ?? $user->address,
                'address_ar' => $request->address_ar ?? $user->address_ar,
            ];

            if ($request->filled('password')) {
                $update['password'] = Hash::make($request->password);
            }

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $path = 'users';
                $hashName = $file->hashName();
                $file->store('public/' . $path);
                $update['photo'] = $path . '/' . $hashName;
            }

            User::where('id', $user->id)->update($update);

            return $this->returnSuccessMessage('Profile updated successfully', '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}