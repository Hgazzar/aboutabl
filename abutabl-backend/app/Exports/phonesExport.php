<?php

namespace App\Exports;

use App\Models\Qu;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\FromQuery;
use App\Helpers\Helper;
use Illuminate\Support\Facades\Date;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\WithHeadings;

class phonesExport implements FromCollection ,WithMapping , WithHeadings
{
    use Exportable;
    /**
    * @return \Illuminate\Support\Collection
    */

    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function headings(): array
    {
        return ["ID", "subject", "unit","lesson","type","question","corAnswer","reasoning","reasoningIsRequired","answer1","answer2","answer3","answer4","answer5","answer6","answer7","answer8","answer2.1","answer2.2",,"answer2.3",,"answer2.4",,"answer2.5","answer2.6",,"answer2.7","answer2.8"];
    }

    public function collection()
    {
      
        $question =  Questions::where('status','1');

               if(request()->has('subject_id'))
                $question = $question->where('subject_id',request('subject_id'));
               if(request()->has('unit_id'))
                $question = $question->where('unit_id',request('unit_id'));
               if(request()->has('lesson_id'))
                $question = $question->where('lesson_id',request('lesson_id'));
               if(request()->has('type'))
                $question = $question->where('type',request('type'));
               if(request()->has('date_from') and !empty(request('date_from')))
                {
                   $question = $question->whereDate('created_at','>=',$from)
                                        ->whereDate('created_at','<=',$to);
                }
               if(request()->has('id'))
                 $question = $question->whereIN('id',request()->has('id'));

       return $question->get();
    }


    public function map($question): array
    {
        return [
            $question->id,
            $question->subject_id,
            $question->unit_id,
            $question->lesson_id,
            $question->type,
            $question->question,
            $question->corAnswer,
            $question->reason,
            $question->reason_is_required,
            $question->answer1,
            $question->answer2,
            $question->answer3,
            $question->answer4,
            $question->answer5,
            $question->answer6,
            $question->answer7,
            $question->answer8,
            $question->answer1_1,
            $question->answer1_2,
            $question->answer1_3,
            $question->answer1_4,
            $question->answer1_5,
            $question->answer1_6,
            $question->answer1_7,
            $question->answer1_8,
           
        ];
    }
}
