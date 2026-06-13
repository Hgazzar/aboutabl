<?php

namespace App\Imports;

use App\Helpers\Helper;
use App\Models\User;
use App\Models\Role;
use App\Models\Governs;
use App\Models\Cities;
use App\Models\SchoolsRoles;
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

class EmployeesImport implements ToCollection ,WithChunkReading,ShouldQueue,WithEvents
{
    use Dispatchable , Importable , GeneralTrait ;
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    
    protected $school_id;

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
                // Template columns: First name [EN], First name [AR], Second name [EN], Second name [AR], role, Email, Phone, Governments, City, Username
                $first_name_en  = trim($row[0] ?? '');
                $first_name_ar  = trim($row[1] ?? '');
                $second_name_en = trim($row[2] ?? '');
                $second_name_ar = trim($row[3] ?? '');
                $role           = $row[4] ?? '';
                $email          = $row[5] ?? '';
                $phone_from_file = $row[6] ?? '';
                $gov            = $row[7] ?? '';
                $city           = $row[8] ?? '';
                $username       = $row[9] ?? '';

                // Build full name from first + second (template has 4 name columns)
                $full_name_en = $first_name_en . ($second_name_en !== '' ? ' ' . $second_name_en : '');
                $full_name_ar = $first_name_ar . ($second_name_ar !== '' ? ' ' . $second_name_ar : '');
                $nameEn = $full_name_en !== '' ? $full_name_en : $full_name_ar;
                $nameAr = $full_name_ar !== '' ? $full_name_ar : $full_name_en;

                // Process when username is present and at least one name is present (after fallback)
                if (trim($username) !== '' && ($nameEn !== '' || $nameAr !== '')) {
                //   $joining_date   = $row[10]??"";

                    // Ensure phone is unique (DB: users_phone_unique). Avoid duplicate or role-like values.
                    $phone = $this->ensureUniquePhone($phone_from_file ?? '', $username, null);

                    $check = User::where([['username',$username]])->count();
                    // $grade = Grades::where('id', $grade_id)->first();
                    $role_data = Role::where('id',$role)->orWhere('name', 'LIKE', '%'.$role.'%')->first();
                    $gov_data = Governs::where('id',$gov)->orWhere('name_en', 'LIKE', '%'.$gov.'%')->orWhere('name_ar', 'LIKE', '%'.$gov.'%')->first();
                    $city_data = Cities::where('id',$city)->orWhere('name_en', 'LIKE', '%'.$city.'%')->orWhere('name_ar', 'LIKE', '%'.$city.'%')->first();
                    // dd($role_data, $gov_data, $city_data);
                    
                    // $new_format = date('Y-m-d', strtotime($joining_date));
                    // dd($new_format, $joining_date);
                    DB::beginTransaction();

                    
                    if($check == 0)
                    {
                           $password = $this->generate_password();

                           $user  = User::create([
                               'name'       => $nameEn,
                               'name_ar'    => $nameAr,
                            //   'fname_en'   => $f_name_en,
                            //   'fname_ar'   => $f_name_ar,
                            //   'lname_en'   => $l_name_en,
                            //   'lname_ar'   => $l_name_ar,
                               'username'   => $username,
                               'phone'      => $phone,
                               'email'      => $email,
                            //   'birthday'   => $request->birthday ?? null,
                            //   'gender'     => $request->gender ?? null,
                            //   'specialize' => $request->specialization_en ?? null,
                            //   'specialize_ar' => $request->specialization_ar ?? null,
                               'role_id'    => $role_data ? $role_data->id : 0,
                              'joining_date'=> date("Y-m-d"),
                               'status'     => '1',
                            //   'address'   => $request->address_en ?? null,
                            //   'address_ar'=> $request->address_ar ?? null,
                               'govern_id' => $gov_data ? $gov_data->id : 0,
                               'city_id'   => $city_data ? $city_data->id : 0,
                            //   'photo'=>$request->photo ? $path.'/'.$hashName : null,
                               'password'   => bcrypt($password),
                               'defaultPassword'  => $password,
                               'type'      => 'user',
                               'school_id' => $this->school_id,
                            //   'joining_date'  => date('Y-m-d', strtotime($joining_date)),
                               'verify'    => '1'
                            ]);
                        
                            User::where('id',$user->id)->update([
                              'memberShip'=>$this->generate_key($user->id)
                            ]);
            
                            SchoolsRoles::create([
                                'role_id'        => $role_data ? $role_data->id : 0,
                                'user_id'        => $user->id,
                                'school_id'      => $this->school_id,
                            ]);

                        //   $role_data = Role::find($role);
                        if($role_data) {
                           $user->assignRole($role_data);
                        }

                    }
                   else
                   {
                        $row =  User::where([['username',$username]])->first();
                        $phone = $this->ensureUniquePhone($phone_from_file ?? '', $username, $row->id);

                        User::where('id',$row->id)->update([
                               'name'       => $nameEn,
                               'name_ar'    => $nameAr,
                            //   'fname_en'   => $f_name_en,
                            //   'fname_ar'   => $f_name_ar,
                            //   'lname_en'   => $l_name_en,
                            //   'lname_ar'   => $l_name_ar,
                               'username'   => $username,
                               'phone'      => $phone,
                               'email'      => $email,
                            //   'birthday'   => $request->birthday ?? null,
                            //   'gender'     => $request->gender ?? null,
                            //   'specialize' => $request->specialization_en ?? null,
                            //   'specialize_ar' => $request->specialization_ar ?? null,
                               'role_id'    => $role_data ? $role_data->id : 0,
                            //   'joining_date'=> date("Y-m-d"),
                               'status'     => '1',
                            //   'address'   => $request->address_en ?? null,
                            //   'address_ar'=> $request->address_ar ?? null,
                               'govern_id' => $gov_data ? $gov_data->id : 0,
                               'city_id'   => $city_data ? $city_data->id : 0,
                            //   'photo'=>$request->photo ? $path.'/'.$hashName : null,
                            //   'password'  => $password,
                               'type'      => 'user',
                               'school_id' => $this->school_id,
                            //   'joining_date'  => date('Y-m-d', strtotime($joining_date)),
                               'verify'    => '1'
                            ]);
                        
            
                            // SchoolsRoles::create([
                            //     'role_id'        => $role,
                            //     'user_id'        => $user->id,
                            //     'school_id'      => $this->school_id,
                            // ]);

                        //   $role_data = Role::find($role);
                           if($role_data) {
                           $row->assignRole($role_data);
                        }


                   }
                DB::commit();
                }
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
    
    /**
     * Return a phone value that is unique in users table (max 15 chars).
     * If the given phone is already used (or would conflict), append suffix from username/counter.
     *
     * @param string $phone
     * @param string $username
     * @param int|null $excludeUserId  When updating, exclude this user id from uniqueness check
     * @return string
     */
    protected function ensureUniquePhone(string $phone, string $username, ?int $excludeUserId = null): string
    {
        $phone = trim($phone);
        if ($phone === '') {
            $phone = 'emp';
        }
        $base = substr($phone, 0, 15);
        $query = User::where('phone', $base);
        if ($excludeUserId !== null) {
            $query->where('id', '!=', $excludeUserId);
        }
        if (!$query->exists()) {
            return $base;
        }
        $suffix = 0;
        do {
            $candidate = substr($phone, 0, 8) . '_' . substr($username, 0, 4);
            if ($suffix > 0) {
                $candidate .= (string) $suffix;
            }
            $candidate = substr($candidate, 0, 15);
            $q = User::where('phone', $candidate);
            if ($excludeUserId !== null) {
                $q->where('id', '!=', $excludeUserId);
            }
            $exists = $q->exists();
            $suffix++;
        } while ($exists && $suffix < 10000);
        return $candidate;
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
}
