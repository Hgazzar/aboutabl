<?php

namespace App\Http\Controllers\Api\AdminControllers;
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
        auth()->setDefaultDriver('admin-api');
    }

    public function index(Request $request)
    {

           $notifications = DB::table('notifications')
           				->leftjoin('students', 'students.id', '=', 'notifications.from_user_id')
                       ->whereIN('notifications.is_read',request()->has('is_read') ? [request('is_read')] : [0,1] ) 
                        ->where('notifications.to_user_type',"teacher") 
                        ->where('notifications.to_user_id',auth()->user()->id) 
                        ->take($request->limit > 0 ? $request->limit : 10000)
                        ->orderBy('notifications.created_at','desc')
                      	->select('notifications.id','notifications.title','notifications.description','notifications.is_read',DB::raw("CONCAT( 'https://aboutablsite.poultrystore.net/',notifications.url) AS url"),"from_user_id as from_id","students.name",DB::raw("CONCAT( '".asset('/storage')."/' ,students.photo) AS photo") )
                        ->get();
            

           return response()->json([
            'status'  => true ,
            'notifications'=>$notifications,
            ] , 200); 
    }

     public function update($id,Request $request)
     {
        try {
              Notification::where('id',$id)->update([
              	'is_read' => 1
              ]);
               
              return $this -> returnSuccessMessage( __('api.Notifications Updated Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function delete_all(Request $request)
     {
       try {
              Notification::where('to_user_type',"teacher")
              		      ->where('to_user_id',auth()->user()->id)->delete();
                 return $this -> returnSuccessMessage( __('api.Notifications Deleted Successfully') ,"200",200);
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}