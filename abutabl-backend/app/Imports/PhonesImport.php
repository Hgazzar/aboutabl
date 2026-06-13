<?php

namespace App\Imports;

use App\Jobs\savePhone;
use App\Models\Phones;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Collection;
// use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use App\Notifications\ImportHasFailedNotification;
use Maatwebsite\Excel\Concerns\Importable;
use Illuminate\Foundation\Bus\Dispatchable;


class PhonesImport implements ToCollection ,WithChunkReading,ShouldQueue,WithEvents
{
    use Dispatchable , Importable;
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    // public function model(array $row)
    // {
    //     return new Phones([
    //         "phone"           => $row[0],
    //         "company"         => 'etisalat',
    //         "invoice_value"   => '100',
    //     ]);
    // }
    private $name;
    public function  __construct($name)
    {
        $this->name= $name;
    }

    public function collection(Collection $rows)
    {
        
        foreach ($rows as $r=>$row) 
        {            
            if($r == 0)
            {
                if(
                    $row[0]  != 'subject'||
                    $row[1]  != 'unit'||
                    $row[2]  != 'lesson'||
                    $row[3]  != 'type'   ||
                    $row[4]  != 'question' ||
                    $row[5]  != 'corAnswer' ||
                    $row[6]  != 'answer1' ||
                    $row[7]  != 'answer2' ||
                    $row[8]  != 'answer3' ||
                    $row[9]  != 'answer4' ||
                    $row[10]  != 'answer5' ||
                    $row[11]  != 'answer6' ||
                    $row[12]  != 'answer7' ||
                    $row[13]  != 'answer8' ||
                    $row[14]  != 'answer2.1' ||
                    $row[15]  != 'answer2.2' ||
                    $row[16]  != 'answer2.3' ||
                    $row[17]  != 'answer2.4' ||
                    $row[18]  != 'answer2.5' ||
                    $row[19]  != 'answer2.6' ||
                    $row[20]  != 'answer2.7' ||
                    $row[21]  != 'answer2.8' ||
                )
                {
                    return false;
                }
            }else{
              return true;
            }
                
            // }
            
        }

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
