<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\Subject;
use App\Models\Grades;
use App\Models\TeachersGrades;
use App\Models\SchoolsRoles;
use App\Models\AssignsStudents;
use App\Models\Assigns;
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
use App\Models\Role;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EmployeesExport;
use App\Imports\EmployeesImport;

class EmployessController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        // In this codebase, "teachers" permissions gate the employees module.
        $this->middleware("can:view-teachers")->only("index","show","subjects","Grades","assigning");
        $this->middleware("can:add-teachers")->only("store","fileImport");
        $this->middleware("can:edit-teachers")->only("update","assign_grade");
        $this->middleware("can:activation-teachers")->only("status");
        $this->middleware("can:delete-teachers")->only("destroy");
        $this->middleware("can:export-teachers")->only("export");
    }

     public function index(Request $request)
    {
        try {
           $school_id      = $request->school_id;
           $users_count    = User::where('type','user')->where('school_id',$school_id)->count();
           $users_active   = User::where('type','user')->where('school_id',$school_id)
                      ->where('status','1')->count();
           $users_inactive = User::where('type','user')->where('school_id',$school_id)
                     ->where('status','0')->count();
           $users_new      = User::where('type','user')->where('school_id',$school_id)
                     ->whereMonth('created_at', now()->month)->count();

           $users = DB::table('users')
                         ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                         ->When($request->search,function($query) use($request){
                                $query->where('users.name','like','%'.$request->search.'%')
                                ->orwhere('users.name_ar','like','%'.$request->search.'%')
                                ->orwhere('users.phone','like','%'.$request->search.'%')
                                ->orwhere('users.email','like','%'.$request->search.'%');
                            })->where('users.type','user')->where('users.school_id',$school_id);

          if($request->has('paginate') and $request->paginate > 0)
                  $users = $users->orderBy('users.created_at',$request->order ?? 'desc')
                  ->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','users.email','users.phone','users.status','users.joining_date','roles.id as role_id','roles.name as role_name')
                  ->paginate($request->paginate ?? 6);
          else
                 $users = $users->orderBy('users.created_at',$request->order ?? 'desc')
                 ->where('users.status','1')
                 ->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','roles.name as role_name')
                 ->get();
                 

           return response()->json([
            'status'  => true ,
            'users_count'=>$users_count,
            'users_active'=>$users_active,
            'users_inactive'=>$users_inactive,
            'users_new'=>$users_new,
            'users' => $users,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
              // Normalize optional location fields: treat 0/"0" as no selection so exists validation passes
              $request->merge([
                  'govern_id' => $request->filled('govern_id') && (string)$request->govern_id !== '0' ? $request->govern_id : null,
                  'city_id'   => $request->filled('city_id') && (string)$request->city_id !== '0' ? $request->city_id : null,
              ]);

              $rules = [
                "full_name_en"    => 'required_without:full_name_ar|nullable|string|min:1|max:255',
                "full_name_ar"    => 'required_without:full_name_en|nullable|string|min:1|max:255',
                "username"        => "required|unique:users,username",
                "password"        => "required|min:8",
                "school_id"       => "required|exists:schools,id",
                "email"           => "nullable|email|unique:users,email",
                "birthday"        => "nullable|date_format:Y-m-d|",
                "phone"           => "nullable|unique:users,phone",
                "gender"          => 'nullable|in:male,female',
                "specialization_en" => "nullable|string|min:2|max:50",
                "specialization_ar" => "nullable|string|min:2|max:50",
                "role_id"         => "nullable|exists:roles,id",
                "govern_id"       => "nullable|exists:governs,id",
                "city_id"         => "nullable|exists:cities,id",
                "address_en"      => "nullable|min:10|max:1000",
                "address_ar"      => "nullable|min:10|max:1000",
                "status"          => "nullable|in:1,0",
                "photo"           => "nullable|mimes:jpg,jpeg,png",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            // Name fallback: use Arabic as English and vice versa when one is missing
            $nameEn = trim($request->full_name_en ?? '') ?: trim($request->full_name_ar ?? '');
            $nameAr = trim($request->full_name_ar ?? '') ?: trim($request->full_name_en ?? '');

            // When caller can only add teachers (no add-users), force role to teacher
            $roleIdToUse = $request->role_id;
            if (auth()->user()->can('add-teachers') && !auth()->user()->can('add-users')) {
                $teacherRole = Role::whereRaw('LOWER(name) = ?', ['teacher'])->first();
                if (!$teacherRole) {
                    return $this->returnError(400, __('api.Teacher role not found'), 400);
                }
                $roleIdToUse = $teacherRole->id;
            }
            if ($roleIdToUse === null || $roleIdToUse === '') {
                $roleIdToUse = 0;
            }

             DB::beginTransaction();

           $photoPath = null;
           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'users';
                    $file->store('public/'.$path);
                    $photoPath = $path.'/'.$hashName;
           }

           $user  = User::create([
                   'name'       => $nameEn,
                   'name_ar'    => $nameAr,
                //   'fname_en'   => $request->fname_en,
                //   'fname_ar'   => $request->fname_ar,
                //   'lname_en'   => $request->lname_en,
                //   'lname_ar'   => $request->lname_ar,
                   'username'   => $request->username,
                   'phone'      => $request->phone ?? null,
                   'email'      => $request->email ?? null,
                //   'birthday'   => $request->birthday ?? null,
                //   'gender'     => $request->gender ?? null,
                //   'specialize' => $request->specialization_en ?? null,
                //   'specialize_ar' => $request->specialization_ar ?? null,
                   'role_id'    => $roleIdToUse ?: 0,
                   'joining_date'=> date("Y-m-d"),
                   'status'     => $request->status == '0' ? '0' : '1',
                //   'address'   => $request->address_en ?? null,
                //   'address_ar'=> $request->address_ar ?? null,
                   'govern_id' => $request->govern_id ?? null,
                   'city_id'   => $request->city_id ?? null,
                   'photo'     => $photoPath,
                   'password'  => bcrypt($request->password),
                   'defaultPassword' => $request->password,
                   'type'      => 'user',
                   'school_id' => $request->school_id,
                   'verify'    => '1'
                ]);
            
                User::where('id',$user->id)->update([
                  'memberShip'=>$this->generate_key($user->id)
                ]);

                  if(request()->has('school_id'))
                 {
                     SchoolsRoles::create([
                        'role_id'        => $user->role_id,
                        'user_id'        => $user->id,
                        'school_id'      => $request->school_id,
                    ]);
                 }
                   if ($roleIdToUse) {
                       $role = Role::find($roleIdToUse);
                       if ($role) {
                           $user->assignRole($role);
                       }
                   }
              

                DB::commit();

             return $this->returnData('user',User::find($user->id), __('api.Employee Added Successfully') ,200);

          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

 public function update($id,Request $request){
        try {
              // Normalize optional location fields: treat 0/"0" as no selection so exists validation passes
              $request->merge([
                  'govern_id' => $request->filled('govern_id') && (string)$request->govern_id !== '0' ? $request->govern_id : null,
                  'city_id'   => $request->filled('city_id') && (string)$request->city_id !== '0' ? $request->city_id : null,
              ]);

              $rules = [
                "full_name_en"    => 'required_without:full_name_ar|nullable|string|min:1|max:255',
                "full_name_ar"    => 'required_without:full_name_en|nullable|string|min:1|max:255',
                "username"        => "required|unique:users,username,".$id,
                "email"           => "nullable|email|unique:users,email,".$id,
                "birthday"        => "nullable|date_format:Y-m-d|",
                "phone"           => "nullable|unique:users,phone,".$id,
                "gender"          => 'nullable|in:male,female',
                "specialization_en" => "nullable|string|min:2|max:50",
                "specialization_ar" => "nullable|string|min:2|max:50",
                "role_id"         => "nullable|exists:roles,id",
                "govern_id"       => "nullable|exists:governs,id",
                "city_id"         => "nullable|exists:cities,id",
                "address_en"      => "nullable|min:10|max:1000",
                "address_ar"      => "nullable|min:10|max:1000",
                "password"        => "nullable|min:8",
                "status"          => "nullable|in:1,0",
                "photo"           => "nullable|mimes:jpg,jpeg,png",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            // Name fallback: use Arabic as English and vice versa when one is missing
            $nameEn = trim($request->full_name_en ?? '') ?: trim($request->full_name_ar ?? '');
            $nameAr = trim($request->full_name_ar ?? '') ?: trim($request->full_name_en ?? '');

             DB::beginTransaction();

             $user  = User::find($id);

            if(!$user)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
               

           $photoPath = $user->photo;
           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'users';
                    $file->store('public/'.$path);
                    $photoPath = $path.'/'.$hashName;
           }
            
            $updateData = [
                   'name'       => $nameEn,
                   'name_ar'    => $nameAr,
                   'username'   => $request->username,
                   'phone'      => $request->phone ?? $user->phone,
                   'email'      => $request->email ?? $user->email,
                   'role_id'    => $request->role_id ?? $user->role_id,
                   'status'     => $request->status ?? $user->status,
                   'govern_id'  => $request->govern_id ?? null,
                   'city_id'    => $request->city_id ?? null,
                   'photo'      => $photoPath,
                   'password'   => $request->password ? bcrypt($request->password) : $user->password,
                   'verify'     => '1',
                ];
            if ($request->password) {
                $updateData['defaultPassword'] = $request->password;
            }
            User::where('id',$id)->update($updateData);
              
            $roleId = $request->role_id ?? $user->role_id;
            if ($roleId) {
                $role = Role::find($roleId);
                if ($role) {
                    $user->roles()->sync($role);
                }
            }

                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Employee Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function show($id,Request $request){
        try {
             DB::beginTransaction();

             $check = User::find($id);
            
             $user = DB::table('users')
                  ->leftjoin('governs', 'users.govern_id', '=', 'governs.id')
                  ->leftjoin('cities', 'users.city_id', '=', 'cities.id')
                  ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                  ->where('users.id',$id)
                  ->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','users.name_ar as name_ar','users.name as name_en','users.fname_en','users.fname_ar','users.lname_en','users.lname_ar','users.email','users.status','users.phone','users.joining_date','governs.name_'.app()->getLocale() .' as govern','users.govern_id','cities.name_'.app()->getLocale() .' as city','users.city_id','users.birthday','users.address as address_en','users.address_ar as address_ar',DB::raw("CONCAT( '".asset('/storage')."/' ,users.photo) AS photo"),'users.gender','users.specialize as specialization_en','users.specialize_ar as specialization_ar','users.username','users.memberShip as memberShipID','roles.name as employeeType','users.role_id','users.birthday','users.school_id')
                  ->get();

            //   $subjectsIds = TeachersGrades::where('user_id',$check->id)
            //                               ->where('school_id',$check->school_id)
            //                               ->pluck('subject_id')->toArray();

            // $subjects = $subjects->orderBy('created_at',$request->order ?? 'desc')
            //         ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name',DB::raw("CONCAT( '".asset('/storage')."/' ,photo) AS photo"))
            //         ->with([
            //         'subjectscholl' => function ($query) {
            //             $query->where('school_id', '=', request('school_id'));
            //         }])
            //         ->withCount('Units')
            //         ->withCount('Lessons')
            //         ->withCount([
            //         'grades as grades' => function ($query) {
            //             $query->where('school_id', '=', request('school_id'));
            //         }]);

            //     if($request->has('paginate') and $request->paginate > 0)
            //      $subjects = $subjects->paginate($request->paginate);

            //    else
            //      $subjects = $subjects->get();

            return $this->returnData('user', $user);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
     public function subjects($id,Request $request){
        try {
             DB::beginTransaction();

            $rules = [
               "school_id" => "required|exists:schools,id",
            ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             $user = User::find($id);

             $subjectsIds = TeachersGrades::where('user_id',$user->id)
                                          ->where('school_id',$user->school_id)
                                          ->pluck('subject_id')->toArray();

            $subjects = Subject::When($request->search,function($query) use($request){
                                $query->where('name','like','%'.$request->search.'%');
                            })
                    ->whereIN('id',$subjectsIds)
                    ->orderBy('created_at',$request->order ?? 'desc')
                    ->select('id',app()->getLocale()=='ar'?'name_ar as name':'name',DB::raw("CONCAT( '".asset('/storage')."/' ,photo) AS photo"))
                    ->with([
                    'teachers' => function ($query) {
                        $query->where('school_id', '=', request('school_id'));
                    }])
                    ->withCount('Units')
                    ->withCount('Lessons');

                if($request->has('paginate') and $request->paginate > 0)
                 $subjects = $subjects->paginate($request->paginate);

               else
                 $subjects = $subjects->get();

            return $this->returnData('subjects', $subjects);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   public function Grades($id,Request $request){
        try {
             DB::beginTransaction();

            $rules = [
               "school_id" => "required|exists:schools,id",
            ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             $user = User::find($id);

             $gradesIds = TeachersGrades::where('user_id',$user->id)
                                          ->where('school_id',$user->school_id)
                                          ->pluck('grade_id')->toArray();
            
             $grades = Grades::When($request->search,function($query) use($request){
                  $query->where('name','like','%'.$request->search.'%');
              })
              ->where('school_id',$user->school_id) 
              ->whereIN('id',$gradesIds) 
              ->orderBy('created_at',$request->order ?? 'desc')
              ->select('id','name')
              ->with([
                    'teachersclasses' => function ($query) {
                        $query->where('school_id', '=', request('school_id'))
                              ->where('class_id','!=',null);
                    }])
              ->withCount('classes as num_classes')
              ->withCount('students as num_students');

             if($request->has('paginate') and $request->paginate > 0)
                 $grades = $grades->paginate($request->paginate);
            else
                 $grades = $grades->where('status','1')->get();

            return $this->returnData('grades', $grades);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
     public function status($id,Request $request){
        try {
         
             $user = User::find($request->id);

             if(!$user)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
             
             if(!request()->has('school_id') and !request()->has('subject_id'))
              {
                  User::where('id',$id)->update([ 
                            'status'=> $user->status == '1'? '0' : '1',
                    ]);
              }

              else
              {
                 $teacher =  TeachersGrades::where('school_id',$request->school_id)
                                ->where('subject_id',$request->subject_id)
                                ->where('user_id',$id)
                                ->first();   
                           
                             TeachersGrades::where('school_id',$request->school_id)
                                ->where('subject_id',$request->subject_id)
                                ->where('user_id',$id)
                                ->update([ 
                                   'status'=> $teacher->status == '1'? '0' : '1',
                                  ]);
              }

              return $this -> returnSuccessMessage( __('api.Employee Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request){
        try {
              if(!request()->has('school_id') and !request()->has('subject_id'))
              {
                 User::where('id',$id)->delete();
              }

               else
              {
                 $teacher =  TeachersGrades::where('school_id',$request->school_id)
                                ->where('subject_id',$request->subject_id)
                                ->where('user_id',$id)
                                ->delete();   
              }

              return $this -> returnSuccessMessage( __('api.Employee Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function assign_grade($id,Request $request){
        try {
              $rules = [
                "grade_id"     => "required|array|min:1",
                "grade_id.*"  => [
                          'numeric',
                          'exists:grades,id',
                    ],
                "class_id" => "required|array|min:1",
                "school_id" => "required|exists:schools,id",
            ];
           
            $messages = [
                'grade_id.*.numeric' => 'Each grade must be a valid grade ID (number).',
                'grade_id.*.exists'  => 'One or more selected grades do not exist.',
            ];
            $validator = Validator::make($request->all(), $rules, $messages);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             DB::beginTransaction();
                foreach ($request->grade_id as $g =>$g_id) {
                    foreach (explode(',', $request->class_id[$g].',0') as $c_id) {
                     if($c_id != 0){
                      $check = TeachersGrades::where('user_id',$id)->where('grade_id',$g_id)
                       ->where('class_id',$c_id == '0' ? null : $c_id)->where('school_id',$request->school_id)->count();
                    
                      if($check == 1)
                       return $this->returnError('E001',__('api.This teacher was assigned by the same grade and the same class as before'),400);

                        TeachersGrades::create([
                            'user_id'  =>$id,
                            'grade_id' =>$g_id,
                            'class_id' =>$c_id == '0' ? null : $c_id ,
                            'school_id'=>$request->school_id,
                        ]); 
                      }
                    }
                  }  

                DB::commit();

          return $this -> returnSuccessMessage( __('api.Employee Updated Successfully') ,"200",200);

          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function assigning($id,Request $request){
        try {
              $assigning = Assigns::where('created_by',$id)
                          ->with('subject')->withCount('students')
                          // ->select('id','type','type_id','assigned_name','assigned_path','created_at')
                          ->paginate($request->paginate ?? 6);
             
              return response()->json([
              'status'  => true ,
              'lang'    => app()->getLocale(), 
              'assigning'=> $assigning,
              ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
    
    public function export(Request $request) 
    {
          $name = 'Employees_'.date('Y_m_d_h_i_s').'.xlsx';
          Excel::store(new EmployeesExport(), $name, 'real_public');
          return response()->json([
            'status'  => true ,
            'path'=> url('/api/'.$name)
            ] , 200);
    }
  
    public function fileImport(Request $request) 
    {

          $rules = ['file'=> 'required|mimes:xlsx,csv,xls'];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
        Excel::import(new EmployeesImport($request->school_id), $request->file('file')->store('temp'));
         return $this -> returnSuccessMessage('Employees Added Successfully' ,"200",200);
    }

}