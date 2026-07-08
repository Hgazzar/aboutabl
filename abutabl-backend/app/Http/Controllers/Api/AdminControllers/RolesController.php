<?php

namespace App\Http\Controllers\Api\AdminControllers;

use Illuminate\Http\Request;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\User;
use App\Http\Controllers\Controller;
use Response;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;

class RolesController extends Controller
{
    use GeneralTrait ;


    public function __construct(Role $roleRepo)
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-roles")->only("index","show");
        $this->middleware("can:add-roles")->only("store","create");
        $this->middleware("can:edit-roles")->only("update","edit");
        $this->middleware("can:activation-roles")->only("status");
        $this->middleware("can:delete-roles")->only("destroy"); 
    }

     public function index(Request $request)
    {
       try {

         // if($this->userInfo()->can('add-role'))
         // {
           
         $roles = DB::table('roles')
                    ->When($request->search,function($query) use($request){
                      $query->where('name','like','%'.$request->search.'%');
                    })
                     ->where('roles.name','!=','super-admin')
                     ->select('roles.id','roles.name as name','roles.status')
                    ->orderBy('created_at',$request->order ?? 'desc');                  

            if($request->filter_status)
            {
                $roles->where('status',$request->filter_status);    
            }

            if($request->paginate)
             {
               $roles =$roles->paginate($request->paginate);
             }
            else
            {
              $roles = $roles->get();
            }

            return response()->json([
            'status'  => true ,
            'roles' => $roles,
            ] , 200); 
         // }
          
         //  return $this->returnError('E001',__('api.NoPermisson'),400);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function create(Request $request)
    {
       try {

         // if($this->userInfo()->can('add-role'))
         // {

            $permissions = Permission::orderBy('id')
                        ->select(['id','name'])->get();

            $groups = $permissions->map(function ($permission) {
                    return explode("-", $permission->name)[1];
                })->unique();

           foreach ($groups as $g) 
           {
            $k = 0 ; 
             foreach($permissions as $p)
             {
                if(explode("-",$p->name)[1] == $g)
                {
                  $arr[$g][$k] = ['id'=>$p->id,'name'=>$p->name];
                  $k++;
                }
             }
           }

            return response()->json([
            'status'  => true ,
            'permissions' => $arr,
            ] , 200);

            
         // }
          
         //  return $this->returnError('E001',__('api.NoPermisson'),400);

         
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store(Request $request)
    {
       try {
            $rules = [
                "name" => "required|min:2|max:50",
                "permission_id" => "nullable|array",
                "permission_id.*"  =>'exists:permissions,id'
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
           
               DB::beginTransaction();

               $role = Role::create([
                'name' => $request->name,
                'guard_name' =>'admin-api',
                'status'=> $request->status?? 1,
               ]);
               

                if(request()->has('permission_id') and !empty(request('permission_id')))
                {
                    $permission = Permission::whereIn('id', $request['permission_id'])->get();
                    $role->givePermissionTo($permission);
                }

                DB::commit();

            return $this -> returnSuccessMessage( __('api.role added successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


     public function status($id , Request $request){
        try {

             DB::beginTransaction();

             $role = Role::find($request->id);

             if(!$role)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
         
            Role::where('id',$id)->update([ 
                        'status'=> $role->status == '1'? '0' : '1',
                ]);
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.role updated successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function edit(Request $request)
     {
       try {
         // if($this->userInfo()->can('add-role'))
         // {
            $rules = [
                "id" => "required|exists:roles,id"
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             $permissions = Permission::orderBy('id')
                        ->select(['id','name'])->get();

            $groups = $permissions->map(function ($permission) {
                    return explode("-", $permission->name)[1];
                })->unique();

            $role  = Role::where('id',$request->id)->select('id','name','status')->get();
            
            $has_Permissions  = Role::find($request->id)->getAllPermissions()->pluck('id')->toArray();


          foreach ($groups as $g) 
           {
            $k = 0 ; 
             foreach($permissions as $p)
             {
                if(explode("-",$p->name)[1] == $g)
                {
                  if(in_array($p->id, $has_Permissions))
                     $arr[$g][$k] = ['id'=>$p->id,'name'=>$p->name,'selected'=>'1'];
                  else
                     $arr[$g][$k] = ['id'=>$p->id,'name'=>$p->name,'selected'=>'0'];
                  $k++;
                }
             }
           }

            return response()->json([
            'status'  => true ,
            'role' => $role,
            'permissions' => $arr,
            ] , 200);

            
         // }
          
         //  return $this->returnError('E001',__('api.NoPermisson'),400);

         
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function update($id , Request $request)
    {
       try {

            $rules = [
                "name" => "required|min:2|max:50",
                "permission_id" => "nullable|array",
                "permission_id.*"  =>'exists:permissions,id'
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

               DB::beginTransaction();

               $role = Role::find($id);

              if(!$role)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

               $name = $role->name == 'super-admin' ? 'super-admin' : $request->name;
              
               $check = Role::where('name',$name)->where('id','!=',$id)->first();

               if($check)
               {
                return $this->returnError('E001',__('api.role has already been taken'),400);
               }

            // if($name != 'super-admin')
            //     {
                    Role::where('id',$request->id)->update([
                        'name'   => $name,
                        'status' => $request->status,
                       ]);
                       
                        if(request()->has('permission_id') and !empty(request('permission_id')))
                        {
                            $permission = Permission::whereIn('id', $request['permission_id'])->get();
                            $role->syncPermissions($permission);
                        }

                // }
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.role updated successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function destroy($id,Request $request){
        try {
         
            $role  = Role::find($id);

            if(!$role)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
               
            $check = User::where('role_id',$id)->count();
            
            if($check > 0)
            {
             return $this->returnError('E001',__('api.cannot delete this item'),400);
            }
               DB::beginTransaction();

              Role::where('id',$id)->delete();
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.role deleted successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   
    public function userPermissions(Request $request)
     {
       try {
            $authUser = auth()->user();
            if(!$authUser) {
                return $this->returnError('E001', 'Unauthorized', 401);
            }

            // Prevent querying other users' permissions (client can pass id, but it must match token user).
            if($request->has('id') && (int)$request->id !== (int)$authUser->id) {
                return $this->returnError('E001', __('api.NoPermisson'), 403);
            }

             $permissions = Permission::orderBy('id')
                        ->select(['id','name'])->get();

            $groups = $permissions->map(function ($permission) {
                    return explode("-", $permission->name)[1];
                })->unique();

            $user  = User::find($authUser->id);
            $role  = Role::where('id',$user->role_id)->select('id','name','status')->get();
            
            $has_Permissions  = Role::find($user->role_id)->getAllPermissions()->pluck('id')->toArray();

            $arr = [];

          foreach ($groups as $g) 
           {
            $k = 0 ; 
             foreach($permissions as $p)
             {
                if(explode("-",$p->name)[1] == $g)
                {
                  if(in_array($p->id, $has_Permissions))
                     $arr[$g][$k] = [$p->name=>'1'];
                  else
                     $arr[$g][$k] = [$p->name=>'0'];
                  $k++;
                }
             }
           }

            return response()->json([
            'status'  => true ,
            'role' => $role,
            'permissions' => $arr,
            'user' => [
                'id' => $user->id,
                'type' => $user->type ?? 'user',
                'username' => $user->username,
                'role_id' => $user->role_id,
                'role_name' => $role[0]->name ?? '',
            ],
            ] , 200);

            
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}
