<?php

namespace App\Http\Controllers\Api\StudentControllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use App\Models\Notification;
use DB ;

class NotificationsController extends Controller
{
    use GeneralTrait ;

     public function __construct()
    {
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {

           $notifications = DB::table('notifications')
           				->leftjoin('users', 'users.id', '=', 'notifications.from_user_id')
                       ->whereIN('notifications.is_read',request()->has('is_read') ? [request('is_read')] : [0,1] ) 
                        ->where('notifications.to_user_type',"student") 
                        ->where('notifications.to_user_id',auth()->user()->id) 
                        ->take($request->limit > 0 ? $request->limit : 10000)
                        ->orderBy('notifications.created_at','desc')
                      	->select('notifications.id','notifications.title','notifications.description','notifications.is_read','notifications.url',"from_user_id as from_id","users.name",DB::raw("CONCAT( '".asset('/storage')."/' ,users.photo) AS photo") )
                        ->get();
            

           return response()->json([
            'status'  => true ,
            'notifications'=>$notifications,
            ] , 200); 
    }

     public function update($id,Request $request)
     {
        try {
              $updated = Notification::where('id', $id)
              	->where('to_user_type', 'student')
              	->where('to_user_id', auth()->user()->id)
              	->update([
              	'is_read' => 1
              ]);

              if ($updated === 0) {
                  return $this->returnError('E403', __('Forbidden.'), 403);
              }
               
              return $this -> returnSuccessMessage( __('api.Notifications Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function delete_all(Request $request)
     {
       try {
              Notification::where('to_user_type',"student")
              		      ->where('to_user_id',auth()->user()->id)->delete();
                 return $this -> returnSuccessMessage( __('api.Notifications Deleted Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}