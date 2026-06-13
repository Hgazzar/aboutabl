<?php

namespace App\Imports;

use App\Helpers\Helper;
use App\Models\Student;
use App\Models\Grades;
use App\Models\Classes;
use App\Models\StudentFamily;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Collection;
// use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use App\Notifications\ImportHasFailedNotification;
use Maatwebsite\Excel\Concerns\Importable;
use Illuminate\Foundation\Bus\Dispatchable;
use DB;
use App\Traits\GeneralTrait;

class StudentsImport implements ToCollection ,WithChunkReading,ShouldQueue,WithEvents
{
    use Dispatchable , Importable , GeneralTrait ;
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    
    private $school_id;

    public function __construct($school_id) 
    {
        $this->school_id = $school_id;
    }

     public function collection(Collection $rows)
    {
        $arr = ['tf','shn'];
        foreach ($rows as $r=>$row) 
        {   
         

            if($r == 0)
            {
                // if(
                //     $row[0]  != 'subject'||
                //     $row[1]  != 'unit'||
                //     $row[2]  != 'lesson'||
                //     $row[3]  != 'type'   
                // )
                // {
                //     return false;
                // }
            }else{
                // dd($row);
                if ($row[0]) {
                  $name    = $row[0];
                  $f_name  = $row[1];
                  $grade_id = $row[2];  //Helper::GetRowName('grades',$row[2],'name')
                  $class_id = $row[3]?? ""; //Helper::GetRowName('classes',$row[3],'name')
                  $email    = $row[4]??"";
                  $code     = $row[5]??"";

                    $check = Student::where([['username',$code]])->count();
                    $grade = Grades::where('school_id', $this->school_id)->where('id', $grade_id)->orWhere('name', $grade_id)->first();
                    $class = Classes::where('school_id', $this->school_id)->where('id',$class_id)->orWhere('name', $class_id)->first();
                    
                    // dd($this->school_id);
                    DB::beginTransaction();

                    
                    if($check == 0)
                    {
                           $password = $this->generate_password();

                           $student  = Student::create([
                                   'name'       => $name,
                                   'name_ar'    => $name,
                                   'email'      => $email,
                                   'gender'     => null,
                                   'status'     => '1',
                                   'address'    =>  null,
                                   'photo'      =>  null,
                                   'password'   => bcrypt($password),
                                   'defaultPassword'  => $password,
                                   'school_id'  => $this->school_id,
                                   'grade_id'   => $grade->id,
                                   'class_id'   => $class->id,
                                ]);
                              

                                $student_code = $this->generate_student_code($student->id);

                                Student::where('id',$student->id)->update([
                                  'memberShip'=> $student_code,
                                  'username'=> $student_code
                                ]);



                                StudentFamily::create([
                                  'student_id' => $student->id,
                                  'relation'   => 'father',
                                  'name'       => $f_name??'',
                                  'name_ar'    => $f_name??'',
                                  'NID'        => '',
                                  'email'      => '',
                                  'phone'      => '',
                                  'job_id'     => 0,
                                ]);

                               StudentFamily::create([
                                  'student_id' => $student->id,
                                  'relation'   => 'mather',
                                  'name'       => '',
                                  'name_ar'    => '',
                                  'NID'        => '',
                                  'email'      => '',
                                  'phone'      => '',
                                  'job_id'     => 0,
                                ]);
                              
                               

                    }
                   else
                   {
                        $row =  Student::where([['username',$code]])->first();

                        Student::where('id',$row->id)->update([
                            'name'       => $name,
                            'name_ar'    => $name,
                            'email'       => $email,
                            'school_id'  => $this->school_id,
                            'grade_id'   => $grade->id,
                            'class_id'   => $class->id,
                        ]);

                        StudentFamily::where('student_id',$row->id)->where('relation','father')->update([
                            'name'       => $f_name??'',
                            'name_ar'    => $f_name??'',
                            'NID'        => '',
                            'email'      => '',
                            'phone'      => '',
                            'job_id'     => 0,
                        ]);

                   }
                }
                DB::commit();
            }
                
            // }
            
        }
            return true;
    }


    public function chunkSize(): int
    {
        return 10;
    }
    
    public function retryUntil()
    {
        return now()->addSeconds(5);
    }

    public function registerEvents(): array
    {
        return [
            ImportFailed::class => function(ImportFailed $event) {
                $this->importedBy->notify(new ImportHasFailedNotification);
            },
        ];
    }
}
