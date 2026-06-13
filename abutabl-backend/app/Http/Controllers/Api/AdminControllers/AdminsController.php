<?php
namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Student;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Token;
use App\Models\TeachersGrades;
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

class AdminsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-users")->only("index","show");
        $this->middleware("can:add-users")->only("store");
        $this->middleware("can:edit-users")->only("update","assign_schools");
        $this->middleware("can:activation-users")->only("status");
        $this->middleware("can:delete-users")->only("destroy"); 
    }

     public function index(Request $request)
    {
        try {
           // Determine user type filter - default to 'all' if not specified
           $userType = $request->has('user_type') && $request->user_type ? $request->user_type : 'all';
           $schoolId = $request->has('school_id') && $request->school_id ? $request->school_id : null;

           // Handle student type - students are in a separate table
           if ($userType === 'student') {
               $students_count = Student::when($schoolId, function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->count();
               $students_active = Student::when($schoolId, function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->where('status','1')->count();
               $students_inactive = Student::when($schoolId, function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->where('status','0')->count();
               $students_new = Student::when($schoolId, function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->whereMonth('created_at', now()->month)->count();

               $students = DB::table('students')
                             ->leftjoin('grades', 'students.grade_id', '=', 'grades.id')
                             ->leftjoin('classes', 'students.class_id', '=', 'classes.id')
                             ->leftjoin('schools', 'students.school_id', '=', 'schools.id')
                             ->When($request->search,function($query) use($request){
                                    $query->where('students.name','like','%'.$request->search.'%')
                                    ->orwhere('students.name_ar','like','%'.$request->search.'%')
                                    ->orwhere('students.username','like','%'.$request->search.'%')
                                    ->orwhere('students.email','like','%'.$request->search.'%');
                                })
                             ->when($schoolId, function($query) use($schoolId) {
                                    return $query->where('students.school_id', $schoolId);
                                });

               if($request->has('paginate') and $request->paginate > 0) {
                   $students = $students->orderBy('students.created_at',$request->order ?? 'desc')
                       ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name','students.email','students.username as phone','students.status','students.created_at as joining_date',DB::raw('NULL as role_id'),DB::raw("'Student' as role_name"))
                       ->paginate($request->paginate ?? 6);
               } else {
                   $students = $students->orderBy('students.created_at',$request->order ?? 'desc')
                       ->where('students.status','1')
                       ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name',DB::raw("'Student' as role_name"))
                       ->get();
               }

               return response()->json([
                'status'  => true ,
                'users_count'=>$students_count,
                'users_active'=>$students_active,
                'users_inactive'=>$students_inactive,
                'users_new'=>$students_new,
                'users' => $students,
                ] , 200);
           }

           // Handle teacher type - teachers are users with type='user' who exist in teachers_grades table
           // Exclude admin users from teacher results
           if ($userType === 'teacher') {
               // Filter teachers by school if provided
               $teacherQuery = TeachersGrades::query();
               if ($schoolId) {
                   $teacherQuery->where('school_id', $schoolId);
               }
               $teacherUserIds = $teacherQuery->distinct()->pluck('user_id')->toArray();
               
               // If no teachers found, return empty results
               if (empty($teacherUserIds)) {
                   $users_count = 0;
                   $users_active = 0;
                   $users_inactive = 0;
                   $users_new = 0;
                   $users = DB::table('users')
                                 ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                                 ->whereRaw('1 = 0'); // Return no results
               } else {
                   // Filter out admin users and super-admin role users - only show users with type='user'
                   // Get teacher user IDs and filter out any that are admins or have super-admin role
                   $superAdminRole = Role::where('name', 'super-admin')->first();
                   $superAdminRoleId = $superAdminRole ? $superAdminRole->id : null;
                   
                   $validTeacherIds = User::where('type', 'user')
                                         ->whereIn('id', $teacherUserIds)
                                         ->when($superAdminRoleId, function($query) use($superAdminRoleId) {
                                             return $query->where('role_id', '!=', $superAdminRoleId);
                                         })
                                         ->when($schoolId, function($query) use($schoolId) {
                                             return $query->where('school_id', $schoolId);
                                         })
                                         ->pluck('id')
                                         ->toArray();
                   
                   if (empty($validTeacherIds)) {
                       $users_count = 0;
                       $users_active = 0;
                       $users_inactive = 0;
                       $users_new = 0;
                       $users = DB::table('users')
                                     ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                                     ->whereRaw('1 = 0'); // Return no results
                   } else {
                       $users_count    = User::where('type', 'user')
                                             ->whereIn('id', $validTeacherIds)
                                             ->count();
                       $users_active   = User::where('type', 'user')
                                             ->whereIn('id', $validTeacherIds)
                                             ->where('status','1')
                                             ->count();
                       $users_inactive = User::where('type', 'user')
                                             ->whereIn('id', $validTeacherIds)
                                             ->where('status','0')
                                             ->count();
                       $users_new      = User::where('type', 'user')
                                             ->whereIn('id', $validTeacherIds)
                                             ->whereMonth('created_at', now()->month)
                                             ->count();

                       $users = DB::table('users')
                                     ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                                     ->When($request->search,function($query) use($request){
                                            $query->where('users.name','like','%'.$request->search.'%')
                                            ->orwhere('users.name_ar','like','%'.$request->search.'%')
                                            ->orwhere('users.phone','like','%'.$request->search.'%')
                                            ->orwhere('users.email','like','%'.$request->search.'%');
                                        })
                                     ->where('users.type', 'user')
                                     ->whereIn('users.id', $validTeacherIds);
                   }
               }
           } else {
               // Handle school filter
               if ($schoolId && $userType === 'admin') {
                   // For admin users, check SchoolsRoles table
                   $adminUserIds = SchoolsRoles::where('school_id', $schoolId)->pluck('user_id')->toArray();
                   $users_count    = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when(!empty($adminUserIds), function($query) use($adminUserIds) {
                                        return $query->whereIn('id', $adminUserIds);
                                    })->count();
                   $users_active   = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when(!empty($adminUserIds), function($query) use($adminUserIds) {
                                        return $query->whereIn('id', $adminUserIds);
                                    })->where('status','1')->count();
                   $users_inactive = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when(!empty($adminUserIds), function($query) use($adminUserIds) {
                                        return $query->whereIn('id', $adminUserIds);
                                    })->where('status','0')->count();
                   $users_new      = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when(!empty($adminUserIds), function($query) use($adminUserIds) {
                                        return $query->whereIn('id', $adminUserIds);
                                    })->whereMonth('created_at', now()->month)->count();

                   $users = DB::table('users')
                                 ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                                 ->When($request->search,function($query) use($request){
                                        $query->where('users.name','like','%'.$request->search.'%')
                                        ->orwhere('users.name_ar','like','%'.$request->search.'%')
                                        ->orwhere('users.phone','like','%'.$request->search.'%')
                                        ->orwhere('users.email','like','%'.$request->search.'%');
                                    })
                                 ->when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('users.type', $userType);
                                    })
                                 ->when(!empty($adminUserIds), function($query) use($adminUserIds) {
                                        return $query->whereIn('users.id', $adminUserIds);
                                    });
               } else {
                   // Calculate counts for users
                   $users_count    = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when($schoolId && $userType === 'user', function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->count();
                   $users_active   = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when($schoolId && $userType === 'user', function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->where('status','1')->count();
                   $users_inactive = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when($schoolId && $userType === 'user', function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->where('status','0')->count();
                   $users_new      = User::when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('type', $userType);
                                    })->when($schoolId && $userType === 'user', function($query) use($schoolId) {
                                        return $query->where('school_id', $schoolId);
                                    })->whereMonth('created_at', now()->month)->count();

                   // If 'all' is selected, include students in counts
                   if ($userType === 'all') {
                       $students_count = Student::when($schoolId, function($query) use($schoolId) {
                                            return $query->where('school_id', $schoolId);
                                        })->count();
                       $students_active = Student::when($schoolId, function($query) use($schoolId) {
                                            return $query->where('school_id', $schoolId);
                                        })->where('status','1')->count();
                       $students_inactive = Student::when($schoolId, function($query) use($schoolId) {
                                            return $query->where('school_id', $schoolId);
                                        })->where('status','0')->count();
                       $students_new = Student::when($schoolId, function($query) use($schoolId) {
                                            return $query->where('school_id', $schoolId);
                                        })->whereMonth('created_at', now()->month)->count();

                       $users_count += $students_count;
                       $users_active += $students_active;
                       $users_inactive += $students_inactive;
                       $users_new += $students_new;
                   }

                   $users = DB::table('users')
                                 ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                                 ->When($request->search,function($query) use($request){
                                        $query->where('users.name','like','%'.$request->search.'%')
                                        ->orwhere('users.name_ar','like','%'.$request->search.'%')
                                        ->orwhere('users.phone','like','%'.$request->search.'%')
                                        ->orwhere('users.email','like','%'.$request->search.'%');
                                    })
                                 ->when($userType !== 'all', function($query) use($userType) {
                                        return $query->where('users.type', $userType);
                                    })
                                 ->when($schoolId && $userType === 'user', function($query) use($schoolId) {
                                        return $query->where('users.school_id', $schoolId);
                                    });
               }
           }

          // Handle 'all' type - combine users and students
          if ($userType === 'all') {
              // Get users
              $usersQuery = $users->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','users.email','users.phone','users.status','users.joining_date','roles.id as role_id','roles.name as role_name','users.created_at');
              
              // Get students
              $studentsQuery = DB::table('students')
                                 ->leftjoin('grades', 'students.grade_id', '=', 'grades.id')
                                 ->leftjoin('classes', 'students.class_id', '=', 'classes.id')
                                 ->leftjoin('schools', 'students.school_id', '=', 'schools.id')
                                 ->When($request->search,function($query) use($request){
                                        $query->where('students.name','like','%'.$request->search.'%')
                                        ->orwhere('students.name_ar','like','%'.$request->search.'%')
                                        ->orwhere('students.username','like','%'.$request->search.'%')
                                        ->orwhere('students.email','like','%'.$request->search.'%');
                                    })
                                 ->when($schoolId, function($query) use($schoolId) {
                                        return $query->where('students.school_id', $schoolId);
                                    })
                                 ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name','students.email','students.username as phone','students.status','students.created_at as joining_date',DB::raw('NULL as role_id'),DB::raw("'Student' as role_name"),'students.created_at');

              // Combine queries using union
              $combinedQuery = $usersQuery->union($studentsQuery);
              
              if($request->has('paginate') and $request->paginate > 0) {
                  // For pagination with union, we need to wrap in a subquery
                  $sql = $combinedQuery->toSql();
                  $bindings = $combinedQuery->getBindings();
                  $combinedResults = DB::table(DB::raw("({$sql}) as combined"))
                                       ->setBindings($bindings)
                                       ->orderBy('created_at', $request->order ?? 'desc')
                                       ->paginate($request->paginate ?? 6);
                  $users = $combinedResults;
              } else {
                  $sql = $combinedQuery->toSql();
                  $bindings = $combinedQuery->getBindings();
                  $combinedResults = DB::table(DB::raw("({$sql}) as combined"))
                                       ->setBindings($bindings)
                                       ->where('status','1')
                                       ->orderBy('created_at', $request->order ?? 'desc')
                                       ->get();
                  $users = $combinedResults;
              }
          } else {
              if($request->has('paginate') and $request->paginate > 0) {
                  $users = $users->orderBy('users.created_at',$request->order ?? 'desc')
                      ->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','users.email','users.phone','users.status','users.joining_date','roles.id as role_id','roles.name as role_name')
                      ->paginate($request->paginate ?? 6);
              } else {
                  $users = $users->orderBy('users.created_at',$request->order ?? 'desc')
                      ->where('users.status','1')
                      ->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','roles.name as role_name')
                      ->get();
              }
          }
                 

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
                "full_name_en" => 'required_without:fname_en|nullable|string|min:1|max:255',
                "full_name_ar" => 'required_without:fname_ar|nullable|string|min:1|max:255',
                "fname_en"     => 'required_without:full_name_en|nullable|string|min:3|max:20',
                "fname_ar"     => 'required_without:full_name_ar|nullable|string|min:3|max:20',
                "lname_en"     => 'required_without:full_name_en|nullable|string|min:3|max:20',
                "lname_ar"     => 'required_without:full_name_ar|nullable|string|min:3|max:20',
                "username" => "required|unique:users,username",
                "email"    => "required|email|unique:users,email",
                "birthday" => "nullable|date_format:Y-m-d|",
                "joining_date" => "nullable|date_format:Y-m-d|",
                "phone"    => "required|unique:users,phone",
                "gender"   => 'nullable|in:male,female',
                "specialization" => "nullable|string|min:2|max:50",
                "specialization_ar" => "nullable|string|min:2|max:50",
                "role_id"   => "required|exists:roles,id",
                "govern_id" => "nullable|exists:governs,id",
                "city_id"   => "nullable|exists:cities,id",
                "address_en"=> "nullable||min:10|max:1000",
                "address_ar"=> "nullable||min:10|max:1000",
                "password"  => "required|min:8",
                "status"    => "nullable|in:1,0",
                "photo"     => "nullable|mimes:jpg,jpeg,png",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            list($name, $nameAr, $fnameEn, $fnameAr, $lnameEn, $lnameAr) = $this->normalizeAdminNames($request);

             DB::beginTransaction();

           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'users';
                    $file->store('public/'.$path);
           }
             
           $user  = User::create([
                   'name'       => $name,
                   'name_ar'    => $nameAr,
                   'fname_en'   => $fnameEn,
                   'fname_ar'   => $fnameAr,
                   'lname_en'   => $lnameEn,
                   'lname_ar'   => $lnameAr,
                   'username'   => $request->username,
                   'phone'      => $request->phone,
                   'email'      => $request->email,
                   'birthday'   => $request->birthday ?? null,
                   'gender'     => $request->gender ?? null,
                   'specialize' => $request->specialization ?? null,
                   'specialize_ar' => $request->specialization_ar ?? null,
                   'role_id'    => $request->role_id,
                   'joining_date'=> $request->joining_date ?? null,
                   'status'     => $request->status == '0' ? '0' : '1',
                   'address'   => $request->address_en ?? null,
                   'address_ar'=> $request->address_ar ?? null,
                   'govern_id' => $request->govern_id ?? null,
                   'city_id'   => $request->city_id ?? null,
                   'photo'=>$request->photo ? $path.'/'.$hashName : null,
                   'password'  => bcrypt($request->password),
                   'type'      => 'admin',
                   'verify'    => '1'
                ]);

               $role = Role::find($request->role_id);$user->assignRole($role);
              
                if(request()->has('school_id') and !empty(request('school_id')))
                 {
                          foreach ($request->school_id as $s) 
                            {
                                 SchoolsRoles::create([
                                  'role_id'        => $user->role_id,
                                  'user_id'        => $user->id,
                                  'school_id'      => $s
                                 ]);
                            }
                 }

                User::where('id',$user->id)->update([
                  'memberShip'=>$this->generate_key($user->id)
                ]);

                DB::commit();

              return $this->returnData('user',User::find($user->id), __('api.Admin Added Successfully') ,200);
          
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
                "full_name_en" => 'required_without:fname_en|nullable|string|min:1|max:255',
                "full_name_ar" => 'required_without:fname_ar|nullable|string|min:1|max:255',
                "fname_en"     => 'required_without:full_name_en|nullable|string|min:3|max:20',
                "fname_ar"     => 'required_without:full_name_ar|nullable|string|min:3|max:20',
                "lname_en"     => 'required_without:full_name_en|nullable|string|min:3|max:20',
                "lname_ar"     => 'required_without:full_name_ar|nullable|string|min:3|max:20',
                "username" => "required|unique:users,username,".request("id"),
                "email"    => "required|email|unique:users,email,".request("id"),
                "birthday" => "nullable|date_format:Y-m-d|",
                "joining_date" => "nullable|date_format:Y-m-d|",
                "phone"    => "required|unique:users,phone,".request("id"),
                "gender"   => 'nullable|in:male,female',
                "specialization" => "nullable|string|min:2|max:50",
                "specialization_ar" => "nullable|string|min:2|max:50",
                "role_id"   => "required|exists:roles,id",
                "govern_id" => "nullable|exists:governs,id",
                "city_id"   => "nullable|exists:cities,id",
                "address_en"   => "nullable||min:10|max:1000",
                "address_ar"=> "nullable||min:10|max:1000",
                "password"  => "nullable|min:8",
                "status"    => "nullable|in:1,0",
                "photo"     => "nullable|mimes:jpg,jpeg,png",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            list($name, $nameAr, $fnameEn, $fnameAr, $lnameEn, $lnameAr) = $this->normalizeAdminNames($request);

             DB::beginTransaction();

             $user  = User::find($id);

            if(!$user)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
               

           if(request()->has('photo') and !empty(request('photo')))
           {
                    $file     = request('photo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'users';
                    $file->store('public/'.$path);
           }
            
            User::where('id',$id)->update([
                   'name'       => $name,
                   'name_ar'    => $nameAr,
                   'fname_en'   => $fnameEn,
                   'fname_ar'   => $fnameAr,
                   'lname_en'   => $lnameEn,
                   'lname_ar'   => $lnameAr,
                   'username'   => $request->username,
                   'phone'      => $request->phone,
                   'email'      => $request->email,
                   'birthday'   => $request->birthday ?? null,
                   'gender'     => $request->gender ?? null,
                   'specialize' => $request->specialization ?? null,
                   'specialize_ar' => $request->specialization_ar ?? null,
                   'role_id'    => $request->role_id,
                   'joining_date'=> $request->joining_date ?? null,
                   'status'     => $request->status ?? $user->status,
                   'address'   => $request->address_en ?? null,
                   'address_ar'=> $request->address_ar ?? null,
                   'govern_id' => $request->govern_id ?? null,
                   'city_id'   => $request->city_id ?? null,
                   'photo'     =>$request->photo ? $path.'/'.$hashName : $user->photo,
                   'password'  =>  $request->password?bcrypt($request->password):$user->password,
                ]);
            
                $role = Role::find(request("role_id"));$user->roles()->sync($role);
                
                if(request()->has('school_id') and !empty(request('school_id')))
                 {

                   SchoolsRoles::where('user_id',$request->id)->delete();

                          foreach ($request->school_id as $s) 
                            {
                                 SchoolsRoles::create([
                                  'role_id'        => $user->role_id,
                                  'user_id'        => $user->id,
                                  'school_id'      => $s
                                 ]);
                            }
                 }

                DB::commit();

                 return $this -> returnSuccessMessage( __('api.Admin Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function show($id,Request $request){
        try {
             DB::beginTransaction();

             $user['info'] = DB::table('users')
                  ->leftjoin('governs', 'users.govern_id', '=', 'governs.id')
                  ->leftjoin('cities', 'users.city_id', '=', 'cities.id')
                  ->leftjoin('roles', 'users.role_id', '=', 'roles.id')
                  ->where('users.id',$id)
                  ->select('users.id',app()->getLocale()=='ar'?'users.name_ar as name':'users.name as name','users.name_ar as name_ar','users.name as name_en','users.fname_en','users.fname_ar','users.lname_en','users.lname_ar','users.email','users.status','users.phone','users.joining_date','governs.name_'.app()->getLocale() .' as govern','users.govern_id','cities.name_'.app()->getLocale() .' as city','users.city_id','users.birthday','users.address as address_en','users.address_ar as address_ar',DB::raw("CONCAT( '".asset('/storage')."/' ,users.photo) AS photo"),'users.gender','users.specialize as specialization_en','users.specialize_ar as specialization_ar','users.username','users.memberShip as memberShipID','roles.name as role_name','users.role_id','users.birthday','users.type')
                  ->get();

            $user_schools   = SchoolsRoles::where('user_id',$id)->pluck('school_id')->toArray(); 

            $schools = DB::table('schools')
                ->leftjoin('governs', 'schools.govern_id', '=', 'governs.id')
                ->leftjoin('cities', 'schools.city_id', '=', 'cities.id')
                ->When($request->search,function($query) use($request){
                                $query->where('schools.name','like','%'.$request->search.'%')
                                      ->where('schools.name_ar','like','%'.$request->search.'%')
                                      ->where('schools.email','like','%'.$request->search.'%')
                                      ->where('schools.contanct_number','like','%'.$request->search.'%');
                            })
                ->orderBy('schools.created_at',$request->order ?? 'desc')
                ->whereIN('schools.id',$this->SchoolsIDs())
                ->select('schools.id',$this->getCurrentLang()=='ar'?'schools.name_ar as name':'schools.name','email','schools.contanct_number','schools.status','governs.name_'.app()->getLocale() .' as govern','cities.name_'.app()->getLocale() .' as city') ;
               if($request->has('paginate') and $request->paginate > 0)
                $schools = $schools->paginate($request->paginate);
               else
                $schools = $schools->get();

           return response()->json([
            'status'  => true ,
            'user' => $user,
            'schools'=>$schools
            ] , 200);
          
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
         
              User::where('id',$id)->update([ 
                        'status'=> $user->status == '1'? '0' : '1',
                ]);
               
              return $this -> returnSuccessMessage( __('api.Admin Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request){
        try {
           
              User::where('id',$id)->delete();
              
              return $this -> returnSuccessMessage( __('api.Admin Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function assign_schools($id , Request $request)
    {
       try {

            $rules = [
                "school_id"    => "nullable|array",
                "school_id.*"  =>'exists:schools,id'
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

               DB::beginTransaction();

                   SchoolsRoles::where('user_id',$request->id)->delete();
                      
                   $user = User::find($id);

                      foreach ($request->school_id as $s) 
                      {
                           SchoolsRoles::create([
                            'role_id'        => $user->role_id,
                            'user_id'        => $user->id,
                            'school_id'      => $s
                           ]);
                      }
                        
                DB::commit();

         return $this -> returnSuccessMessage( __('api.Admin Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Normalize name inputs: accept either full_name_en/full_name_ar or fname_* and lname_* and return [name, name_ar, fname_en, fname_ar, lname_en, lname_ar].
     */
    private function normalizeAdminNames(Request $request): array
    {
        $fullEn = trim($request->full_name_en ?? '');
        $fullAr = trim($request->full_name_ar ?? '');

        if ($fullEn !== '') {
            $pos = strpos($fullEn, ' ');
            $name = $fullEn;
            $fnameEn = $pos === false ? $fullEn : substr($fullEn, 0, $pos);
            $lnameEn = $pos === false ? '' : trim(substr($fullEn, $pos));
        } else {
            $name = trim($request->fname_en ?? '') . ' ' . trim($request->lname_en ?? '');
            $fnameEn = $request->fname_en ?? '';
            $lnameEn = $request->lname_en ?? '';
        }

        if ($fullAr !== '') {
            $pos = strpos($fullAr, ' ');
            $nameAr = $fullAr;
            $fnameAr = $pos === false ? $fullAr : substr($fullAr, 0, $pos);
            $lnameAr = $pos === false ? '' : trim(substr($fullAr, $pos));
        } else {
            $nameAr = trim($request->fname_ar ?? '') . ' ' . trim($request->lname_ar ?? '');
            $fnameAr = $request->fname_ar ?? '';
            $lnameAr = $request->lname_ar ?? '';
        }

        return [$name, $nameAr, $fnameEn, $fnameAr, $lnameEn, $lnameAr];
    }

}