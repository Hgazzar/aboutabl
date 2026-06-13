<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\Student;
use App\Models\Tickets;
use App\Models\TicketsFiles;
use App\Models\TicketsReplies;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;

class TicketsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-tickets")->only("index","show");
        $this->middleware("can:add-tickets")->only("store");
        $this->middleware("can:edit-tickets")->only("addReply");
        $this->middleware("can:activation-tickets")->only("close");
    }


   public function index(Request $request)
    {
        try { 
                 $tickets = Tickets::When($request->search,function($query) use($request){
                                $query->where('title','like','%'.$request->search.'%')
                                      ->orwhere('des','like','%'.$request->search.'%');
                            })
                    ->where('school_id', $this->userInfo()->school_id)
                    ->orderBy($request->order_by??'created_at',$request->order_way ?? 'desc')
                    ->select('id','title','created_at','des','status')
                    ->withCount('Replies')
                    ->paginate($request->paginate ?? 8);
                    
                 return response()->json([
                  'status'  => true ,
                  'tickets' => $tickets,
                  ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request)
    {
      try 
        {
            $user  = auth()->user(); 

            $rules = [
                "title" => "required|string|min:4|max:100",
                "body"  => "nullable|string|min:10|max:1000",
                "files" => "nullable|array|min:1|max:5",
                "files.*"  => [
                        'mimes:jpg,jpeg,png,gif,pdf,txt,word',
                        'max:1024',
                        'distinct', 
                  ]
            ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
            DB::beginTransaction();

            $check   = Tickets::where('title',$request->title)->where('user_id',$user->id)->first();

            if($check)
            {
               return $this->returnError('E001',__('api.ticket has already been taken'));
            }


            $ticket  = Tickets::create([
                          'title'      => $request->title,
                          'des'        => $request->body,
                          'status'     => '0',
                          'user_id'    => $user->id,
                          'school_id'  => $user->school_id
                       ]);

           if(request()->has('files') and !empty(request('files')))
           {
              $total_size = 0;

              foreach (request('files') as $k=>$f)
               {
               if(isset(request('files')[$k]) and !empty(request('files')[$k]))
                 {
                    $file     = request('files')[$k];
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $total_size+= $size;
                    $path     = 'tickets/'.$ticket->id;
                    $file->store('public/'.$path);

                    TicketsFiles::create([
                        'name'      => $f_name,
                        'path'      => $path.'/'.$hashName,
                        'size'      => $size,
                        'extiosion' => $ext,
                        'ticket_id' => $ticket->id,
                    ]);
                 }
               }
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.ticket_added_successfully') ,"200",200);
           }
        }
       
        catch (\Exception $ex)
        {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function show($id,Request $request)
    {
         try {

            $ticket = Tickets::where('id',$id)->first();
              
              if(!$ticket)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }
                
               $ticket = Tickets::where('id',$id)->with('User')->with('Student')->get()
                          ->map(function($event) {
                            return [
                                'id'      => $event->id,
                                'title'   => $event->title,
                                'des'     => $event->des,
                                'status'  => $event->status,
                                'created_at' => $event->created_at,
                                'by'     => $event->student_id != null
                                        ? [
                                           'type'=> 'student',
                                           'id'  => $event->student->id,
                                           'name'=> app()->getLocale()=='ar'?$event->student->name_ar:$event->student->name,
                                           'username'=> $event->student->username,
                                           'photo'=>$event->student->photo !=null ?asset('/storage')."/".$event->student->photo : null,
                                          ] 
                                        : [
                                           'type'=> 'staff',
                                           'id'=>$event->user->id,
                                           'name'=> app()->getLocale()=='ar'?$event->user->name_ar:$event->user->name,
                                           'username'=> $event->user->username,
                                           'photo'=>$event->user->photo !=null ?asset('/storage')."/".$event->user->photo : null,
                                          ],
                            ];
                       });

                $files = DB::table('tickets_files')
                          ->where('tickets_files.ticket_id',$id)
                          ->select('tickets_files.name',DB::raw("CONCAT( '".asset('/storage')."/' ,tickets_files.path) AS path"),'tickets_files.size')
                          ->get();
               
                $replies = TicketsReplies::where('ticket_id',$id)->with('User')->with('Student')
                          ->get()
                          ->map(function($event) {
                            return [
                                'id'      => $event->id,
                                'body'    => $event->body,
                                'created_at' => \Carbon\Carbon::parse($event->created_at)->format('d F, Y H:m A'),
                                'by'     => $event->student_id != null
                                        ? [
                                           'type'=> 'student',
                                           'id'  => $event->student->id,
                                           'name'=> app()->getLocale()=='ar'?$event->student->name_ar:$event->student->name,
                                           'username'=> $event->student->username,
                                           'photo'=>$event->student->photo !=null ?asset('/storage')."/".$event->student->photo : null,
                                          ] 
                                        : [
                                           'type'=> 'staff',
                                           'id'=>$event->user->id,
                                           'name'=> app()->getLocale()=='ar'?$event->user->name_ar:$event->user->name,
                                           'username'=> $event->user->username,
                                           'photo'=>$event->user->photo !=null ?asset('/storage')."/".$event->user->photo : null,
                                          ],
                            ];
                       });
            
            return response()->json([
            'status'  => true,
            'ticket'=>$ticket,
            'ticket_files'=>$files,
            'replies'=>$replies,
            ] , 200); 
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
     
  
     public function close($id,Request $request){
        try {
           
             $ticket = Tickets::find($id);

             if(!$ticket or $ticket->status == 'Closed')
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

             Tickets::where('id',$id)->update([ 
                 'status'=> '1',
                ]);
               
            return $this -> returnSuccessMessage( __('api.ticket_updated_successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function addReply($id,Request $request)
    {
      try 
        {
            $rules = [
                "body"  => "nullable|string|min:2|max:10000",
            ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
             $ticket = Tickets::find($id);

             if(!$ticket or $ticket->status == 'Closed')
             {
              return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
             }

               TicketsReplies::create([
                          'ticket_id'  => $ticket->id,
                          'body'       => $request->body,
                          'user_id'    => auth()->user()->id     
                       ]);

              return $this -> returnSuccessMessage( __('api.Reply_added_successfully') ,"200",200);
           }
        catch (\Exception $ex)
        {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}