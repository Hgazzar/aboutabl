<?php

namespace App\Http\Controllers\Api\StudentControllers;
use App\Models\Student;
use App\Models\Tickets;
use App\Models\TicketsFiles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;

class TicketController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('user-api');
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

            $check   = Tickets::where('title',$request->title)->where('student_id',$user->id)->first();

            if($check)
            {
               return $this->returnError('E001',__('api.ticket has already been taken'));
            }

            $ticket  = Tickets::create([
                          'title'      => $request->title,
                          'des'        => $request->body,
                          'status'     => '0',
                          'student_id' => $user->id,
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

    
  
}