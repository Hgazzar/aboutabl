<?php

namespace App\Traits;
use App\Models\User;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Schools;
use App\Models\Notification;
use App\Models\Role;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\subjectsSchools;
use DB ;


trait GeneralTrait
{


    public function getCurrentLang()
    {
        return app()->getLocale();
    }

    public function returnError($title, $body , $code=400)
    {

        return response()->json([
            'status' => false,
            'errNum' =>$title,
            'msg' => $body
        ] , $code);
        
    }

    public function userInfo()
    {

      return User::where('id',auth()->user()->id)->with('role')->first();
        
    }
 

    public function returnSuccessMessage($msg = "", $errNum = "S000",$code=201,$data = [])
    {
        return response()->json( [
            'status' => true,
            'errNum' => $errNum,
            'msg' => $msg
        ] , $code );
    }

    public function returnData($key, $value, $msg = "" , $code=200)
    {
        return response()->json([
            'status' => true ,
            'errNum' => "200",
            'msg' => $msg,
            $key => $value ,
        ] , $code);
    }

    public function Scope()
    {
       $admin = User::where("id", "=", auth()->user()->id)->first();
       $scope = $admin->roles()->pluck("scope");
       if(!empty($scope[0]))
       {
            return $scope[0];
       }    
       else
      {
        return 'private';
      }
    }
    //////////////////
    public function returnValidationError($code = "E001", $validator)
    {
        return $this->returnError($code, $validator->errors()->first());
    }


    public function returnCodeAccordingToInput($validator)
    {
        $inputs = array_keys($validator->errors()->toArray());
        $code = $this->getErrorCode($inputs[0]);
        return $code;
    }

    public function getErrorCode($input)
    {
        if ($input == "name")
            return 'E0011';

        else if ($input == "password")
            return 'E002';

        else if ($input == "mobile")
            return 'E003';

        else if ($input == "birth_date")
            return 'E005';

        else if ($input == "email")
            return 'E007';

        else if ($input == "city")
            return 'E008';

        else if ($input == "country")
            return 'E009';

        
        else if ($input == "promocode")
            return 'E014';

        else if ($input == "doctor_id")
            return 'E015';

        else if ($input == "payment_method" || $input == "payment_method_id")
            return 'E016';

        else if ($input == "day_date")
            return 'E017';

        else if ($input == "specification_id")
            return 'E018';

        else if ($input == "importance")
            return 'E019';

        else if ($input == "type")
            return 'E020';

        else if ($input == "message")
            return 'E021';

        else if ($input == "reservation_no")
            return 'E022';

        else if ($input == "reason")
            return 'E023';

        else if ($input == "branch_no")
            return 'E024';

        else if ($input == "name_en")
            return 'E025';

        else if ($input == "name_ar")
            return 'E026';

        else if ($input == "gender")
            return 'E027';

        else if ($input == "nickname_en")
            return 'E028';

        else if ($input == "nickname_ar")
            return 'E029';

        else if ($input == "rate")
            return 'E030';

        else if ($input == "price")
            return 'E031';

        else if ($input == "information_en")
            return 'E032';

        else if ($input == "information_ar")
            return 'E033';

        else if ($input == "street")
            return 'E034';

        else if ($input == "branch_id")
            return 'E035';

        else if ($input == "insurance_companies")
            return 'E036';

        else if ($input == "photo")
            return 'E037';

        else if ($input == "logo")
            return 'E038';

        else if ($input == "working_days")
            return 'E039';

        else if ($input == "insurance_companies")
            return 'E040';

        else if ($input == "reservation_period")
            return 'E041';

        else if ($input == "nationality_id")
            return 'E042';

        else if ($input == "commercial_no")
            return 'E043';

        else if ($input == "nickname_id")
            return 'E044';

        else if ($input == "reservation_id")
            return 'E045';

        else if ($input == "attachments")
            return 'E046';

        else if ($input == "summary")
            return 'E047';

        else if ($input == "user_id")
            return 'E048';

        else if ($input == "mobile_id")
            return 'E049';

        else if ($input == "paid")
            return 'E050';

        else if ($input == "use_insurance")
            return 'E051';

        else if ($input == "doctor_rate")
            return 'E052';

        else if ($input == "provider_rate")
            return 'E053';

        else if ($input == "message_id")
            return 'E054';

        else if ($input == "hide")
            return 'E055';

        else if ($input == "checkoutId")
            return 'E056';

        else
            return "";
    }
    public function SchoolsIDs()
    {
           // F-040B: request user_id may only be used by admins (impersonation / support).
           // Non-admins must never resolve another user's school list (tenant-scope poison).
           $authUser = auth()->user();
           if (
               $authUser
               && $authUser->type === 'admin'
               && request()->filled('user_id')
           ) {
              $targetUserId = (int) request('user_id');
              $schoolsIDs = $targetUserId > 0
                  ? SchoolsRoles::where('user_id', $targetUserId)->pluck('school_id')->toArray()
                  : [];
           }
           elseif($authUser && $authUser->type == "admin")
           {
            $schoolsIDs = Schools::orderBy('id')->pluck('id')->toArray();
           }
           else
           {
             $fromRoles = SchoolsRoles::where('user_id', auth()->id())
                 ->pluck('school_id')->toArray();
             $fromTeachersGrades = TeachersGrades::where('user_id', auth()->id())
                 ->distinct()->pluck('school_id')->toArray();
             $schoolsIDs = array_values(array_unique(array_merge($fromRoles, $fromTeachersGrades)));
             if (empty($schoolsIDs) && auth()->user()->school_id) {
                 $schoolsIDs = [auth()->user()->school_id];
             }
           }
        return array_map('intval', $schoolsIDs);
    }
   public function RolesIDs($school_id=0)
    {

           $school_id  = $school_id > 0 ? $school_id: $this->userInfo()->school_id ; 
           $roleIds = SchoolsRoles::where('user_id',auth()->user()->id)->where('school_id',$school_id)->where('status',1)->pluck('role_id')->toArray();
           
        return $roleIds;
    }
    public function Schools()
    {
           if($this->userInfo()->hasRole('super-admin'))
           {
            $schools = Schools::orderBy('id')
                      ->select(['id',app()->getLocale()=='ar'?'name_ar as name':'name',DB::raw("CONCAT( '".asset('/storage')."/' ,logo) AS logo")])
                      ->get();
           }

           else
           {
            
           $schools_roles = SchoolsRoles::where('user_id',auth()->user()->id)->where('role_id', $this->userInfo()->role->id)->where('status',1)->pluck('school_id')->toArray();

           $schools = Schools::whereIn('id',$schools_roles)
                        ->orderBy('id')
                        ->select(['id',app()->getLocale()=='ar'?'name_ar as name':'name',DB::raw("CONCAT( '".asset('/storage')."/' ,logo) AS logo")])
                        ->get();
           }
        return $schools;
    }

    public function subjects($school_id = 0)
    {
        $id       = request('school_id') > 0 ? request('school_id') : $school_id  ; 
        $status   = request('filter_status') != "" ? [request('filter_status')] : ['1','0'];

        if($id > 0)
        $subjects = subjectsSchools::where('school_id',$id)->whereIN('status',$status)->pluck('subject_id')->toArray();
        else
        {
            if(auth()->user()->type != 'admin')
            {
                 $subjects = subjectsSchools::where('school_id',auth()->user()->school_id)->pluck('subject_id')->toArray();
            }
            else
            {
                  $subjects = Subject::get()->pluck('id')->toArray();
            }
        }

        return $subjects;
    }

    public function subjectSchool($subject_id)
    {           
      return  subjectsSchools::where('subject_id',$subject_id)->pluck('school_id')->toArray();
;
    }

    function generate_key($id)
     {      
          $characters = '12345678';
       
          $key = '';
         
            for ($i = 0; $i < 3; $i++) 
            {
                $index = rand(0, strlen($characters) - 1);
                $key .= $characters[$index];
            }    
           $key.=$id ;      
          
           $count  = User::where('memberShip', $key)->count();

           if($count==0)
            {
                return $key;
            }
            else
            {
                return generate_key();
            }
      }
   

    function generate_password()
     {      
          $password = \Str::random(8);
       
          
           $count = Student::where('defaultPassword', $password)->count();

           if($count==0)
            {
                return $password;
            }
            else
            {
                return generate_password();
            }
    }


     function generate_student_code($id=0,$niceName = 0)
     {      
            $school_name = Schools::find(request('school_id'))->name??"";
            $words = explode(" ", $school_name);
            $acronym = "";

            foreach ($words as $w) {
              $acronym .= strtoupper(mb_substr($w, 0, 1));
            }

            if($niceName == 1)
                return   $acronym ;

            $start = '1110';
            $key = ($start + $id)  ;
            // $key = $acronym.$key;
            $key = request('school_id').$key;

           $count = Student::where('memberShip', $key)->count();

           if($count==0)
            {
                return $key;
            }
            else
            {
                return generate_student_code();
            }
      }
   
     function addNotifyFromTeacher($data=[])
     {      
         
         
          $subjectSchool = subjectsSchools::where('subject_id',$data['subject_id'])->whereNotNull('school_id')->where('status','1')->groupBy('school_id')->get();
            
            $all = [] ;

            foreach ($subjectSchool as $key => $row) 
            {
               
            
              $students = Student::where('school_id',$row['school_id'])->where('grade_id',$row['grade_id'])->get();
              
              
              foreach ($students as $key => $student) 
              {
                        Notification::create([
                          'title'          => $data['title'],
                          'description'    => $data['des'],
                          'from_user_type' => "teacher",
                          'from_user_id'   => auth()->user()->id,
                          'to_user_type'   => "student",
                          'to_user_id'     => $student->id,
                          'url'            => $data['url'],
                          'type'           => $data['type'],
                          'type_id'        => $data['type_id'],
                       ]);
              }
            }
            
     }
   
}