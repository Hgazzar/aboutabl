<?php

namespace App\Imports;

use App\Helpers\Helper;
use App\Models\User;
use App\Models\Role;
use App\Models\Governs;
use App\Models\Cities;
use App\Models\Schools;
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

class SchoolsImport implements ToCollection ,WithChunkReading,ShouldQueue,WithEvents
{
    use Dispatchable , Importable , GeneralTrait ;
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    

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
                $name_en = trim($row[0] ?? '');
                $name_ar = trim($row[1] ?? '');
                $name_en = $name_en ?: $name_ar;
                $name_ar = $name_ar ?: $name_en;

                if ($name_en !== '') {
                    $email    = $row[2]??"";
                    $contanct_number     = $row[3]??"";
                    $gov    = $row[4]??"";
                    $city     = $row[5]??"";
                    $address     = $row[6]??null;
                    $address_ar     = $row[7]??null;

                    $check = Schools::where([['name',$name_en]])->where([['name_ar',$name_ar]])->count();
                    $gov_data = Governs::where('id',$gov)->orWhere('name_en', 'LIKE', '%'.$gov.'%')->orWhere('name_ar', 'LIKE', '%'.$gov.'%')->first();
                    $city_data = Cities::where('id',$city)->orWhere('name_en', 'LIKE', '%'.$city.'%')->orWhere('name_ar', 'LIKE', '%'.$city.'%')->first();
                    DB::beginTransaction();

                    if($check == 0)
                    {
                           $user  = Schools::create([
                                'name'      => $name_en,
                                'name_ar'   => $name_ar,
                                'contanct_number'=> $contanct_number,
                                'email'     => $email,
                                'status'    => '1',
                                'address'   => $address,
                                'address_ar'=> $address_ar,
                                'govern_id' => $gov_data ? $gov_data->id : 0,
                                'city_id'   => $city_data ? $city_data->id : 0,
                            ]);
                    }
                   else
                   {
                        $schoolRow =  Schools::where([['name',$name_en]])->where([['name_ar',$name_ar]])->first();
                        
                        Schools::where('id',$schoolRow->id)->update([
                            'name'      => $name_en,
                            'name_ar'   => $name_ar,
                            'contanct_number'=> $contanct_number,
                            'email'     => $email,
                            // 'status'    => '1',
                            'address'   => $address,
                            'address_ar'=> $address_ar,
                            'govern_id' => $gov_data ? $gov_data->id : 0,
                            'city_id'   => $city_data ? $city_data->id : 0,
                        ]);
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
    

}
