<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\Quizes;
use App\Models\QuizesQuestions;
use App\Imports\QuestionsImport;
use App\Imports\QuestionsImportUpdate;
use App\Exports\QuestionsExport;
use App\Models\Questions;
use Maatwebsite\Excel\Facades\Excel;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use DB ;
use File ;
use App\Helpers\Helper;
use App\Http\Resources\questionResource;

class QuestionsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-questions")->only("index","show");
        $this->middleware("can:add-questions")->only("store","create","fileImport");
        $this->middleware("can:edit-questions")->only("update","edit","fileImportUpdate");
        $this->middleware("can:activation-questions")->only("status");
        $this->middleware("can:delete-questions")->only("destroy"); 
        $this->middleware("can:export-questions")->only("export");
    }


     public function index(Request $request)
    {
        try {
               $date = \Carbon\Carbon::parse(now())->format('Y-m-d');
               $from = request('date_from');
               $to = !empty(request('date_to'))?request('date_to'):$date;
               
                 $question = Questions::When($request->search,function($query) use($request){
                                $query->where('question','like','%'.$request->search.'%');
                                      // ->orwhere('question_des','like','%'.$request->search.'%');
                                    });
              
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

                $question = $question->select('id','type',"code",'question','subject_id','unit_id','lesson_id','created_at');


                if($request->has('paginate') and $request->paginate > 0)
                     $question = $question->latest()->paginate($request->paginate);
                else
                     $question = $question->latest()->get();

          return response()->json([
            'status'  => true ,
            'question'=>$question
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

     public function store( Request $request){
        try {
           
              $rules = [
                "quize_id"          => "nullable|exists:quizes,id",
                "type"              => "required|in:MCQ,TF,SHN,Matching",
                'questionBodyType'  => "required|in:text,file",
                'question'          => "required",
                'answerBodyType'    => "required|in:text,file",
                'answer1'           => "required",
                'answer2'           => "required",
                'answer3'           => "nullable",
                'answer4'           => "nullable",
                'answer5'           => "nullable",
                'answer6'           => "nullable",
                'answer7'           => "nullable",
                'answer8'           => "nullable",
                'corAnswer'         => "required",
                'reasoning'         => "nullable",
                'reasoningIsRequired' => "nullable,in:0,1",
                'score'             => "nullable",

               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $question = Helper::uploadQuestion();
            $check = Questions::where([['question',$question]])->count();
            
            if($check > 0)
               return $this->returnError('E001',__('api.This question already exists'),400);

            DB::beginTransaction();

            if(request()->has('quize_id') and $request->quize_id > 0)
            {
               $quize = Quizes::find($request->quize_id);
               $subject_id = $quize->subject_id;
               $unit_id    = $quize->unit_id;
               $lesson_id  = $quize->lesson_id;
               $quize_id   = $request->quize_id;

            }

            $question =  Questions::create([
              'subject_id'   => $subject_id??Null,
              'unit_id'      => $unit_id??Null,
              'lesson_id'    => $lesson_id??Null,
              'quize_id'     => $quize_id??Null,
              'type'         => $request->type,
              'question_body_type' => $request->questionBodyType,
              'question'     => $question,
              'corAnswer'    => $request->corAnswer,
              'reason'       => $request->reason,
              'reason_is_required' =>$request->reason_is_required??0,
              'answer_body_type'=>  $request->answerBodyType,
              'add_to_question_bank' => $request->add_to_question_bank??1,
              'answer1'       => Helper::uploadAnswer(1),
              'answer2'       => Helper::uploadAnswer(2),
              'answer3'       => Helper::uploadAnswer(3),
              'answer4'       => Helper::uploadAnswer(4),
              'answer5'       => Helper::uploadAnswer(5),
              'answer6'       => Helper::uploadAnswer(6),
              'answer7'       => Helper::uploadAnswer(7),
              'answer8'       => Helper::uploadAnswer(8),
              'answer1_1'     => Helper::uploadAnswer("1_1"),
              'answer1_2'     => Helper::uploadAnswer("1_2"),
              'answer1_3'     => Helper::uploadAnswer("1_3"),
              'answer1_4'     => Helper::uploadAnswer("1_4"),
              'answer1_5'     => Helper::uploadAnswer("1_5"),
              'answer1_6'     => Helper::uploadAnswer("1_6"),
              'answer1_7'     => Helper::uploadAnswer("1_7"),
              'answer1_8'     => Helper::uploadAnswer("1_8"),
              'created_by'    => auth()->user()->id,
             ]);

           if(request()->has('quize_id') and $request->quize_id > 0)
            {
               QuizesQuestions::create([
                  'quize_id'     => $request->quize_id,
                  'question_id'  => $question->id,
                  'score'        => $request->score,
                  'created_by'   => auth()->user()->id,
               ]);
            }
             DB::commit();

           return $this->returnData('question',Questions::find($question->id), __('api.Question Added Successfully') ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

      public function update( $id,Request $request){
        try {
           
              $rules = [
                "subject_id"        => "required|exists:subjects,id",
                "unit_id"           => "nullable|exists:units,id",
                "lesson_id"         => "nullable|exists:lessons,id",
                "type"              => "required|in:MCQ,TF,SHN,Matching",
                'questionBodyType'  => "required|in:text,file",
                'question'          => "required",
                'answerBodyType'    => "required|in:text,file",
                'answer1'           => "required",
                'answer2'           => "required",
                'answer3'           => "nullable",
                'answer4'           => "nullable",
                'answer5'           => "nullable",
                'answer6'           => "nullable",
                'answer7'           => "nullable",
                'answer8'           => "nullable",
                'corAnswer'         => "required",
                'reasoning'         => "nullable",
                'reasoningIsRequired' => "nullable,in:0,1",

               ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            $question = Helper::uploadQuestion();
            $check = Questions::where([['question',$question],['id','!=',$id]])->count();
            
            if($check > 0)
               return $this->returnError('E001',__('api.This question already exists'),400);

            DB::beginTransaction();

            $question =  Questions::where('id',$id)->update([
              'subject_id'   => $request->subject_id??Null,
              'unit_id'      => $request->unit_id??Null,
              'lesson_id'    => $request->lesson_id??Null,
              'type'         => $request->type,
              'question_body_type' => $request->questionBodyType,
              'question'     => $question,
              'corAnswer'    => $request->corAnswer,
              'reason'       => $request->reason,
              'reason_is_required' =>$request->reason_is_required??0,
              'answer_body_type'=>  $request->answerBodyType,
              // 'add_to_question_bank' => $request->add_to_question_bank??1,
              'answer1'       => Helper::uploadAnswer(1),
              'answer2'       => Helper::uploadAnswer(2),
              'answer3'       => Helper::uploadAnswer(3),
              'answer4'       => Helper::uploadAnswer(4),
              'answer5'       => Helper::uploadAnswer(5),
              'answer6'       => Helper::uploadAnswer(6),
              'answer7'       => Helper::uploadAnswer(7),
              'answer8'       => Helper::uploadAnswer(8),
              'answer1_1'     => Helper::uploadAnswer("1_1"),
              'answer1_2'     => Helper::uploadAnswer("1_2"),
              'answer1_3'     => Helper::uploadAnswer("1_3"),
              'answer1_4'     => Helper::uploadAnswer("1_4"),
              'answer1_5'     => Helper::uploadAnswer("1_5"),
              'answer1_6'     => Helper::uploadAnswer("1_6"),
              'answer1_7'     => Helper::uploadAnswer("1_7"),
              'answer1_8'     => Helper::uploadAnswer("1_8"),
              'created_by'    => auth()->user()->id,
             ]);

          
             DB::commit();

           return $this->returnData('question',Questions::find($id), __('api.Question Updated Successfully') ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


    public function fileImport(Request $request)
    {
        $rules = ['file' => 'required|mimes:xlsx,csv,xls'];
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);
            return $this->returnValidationError($code, $validator);
        }

        $subjectId = $request->has('subject_id') ? (int) $request->get('subject_id') : null;
        $importer = new QuestionsImport($subjectId);
        Excel::import($importer, $request->file('file')->store('temp'));

        $skippedTotal = $importer->duplicates + $importer->skipped_other;
        $summary = [
            'imported' => $importer->imported,
            'duplicates' => $importer->duplicates,
            'skipped_other' => $importer->skipped_other,
            'skipped' => $skippedTotal,
            'errors' => $importer->errors,
        ];

        if ($importer->imported === 0) {
            $msg = $skippedTotal > 0
                ? 'No questions were imported. Review duplicates and row issues below.'
                : 'No data rows were processed. Check the template and required columns.';

            return $this->returnData('import_summary', $summary, $msg, 200);
        }

        $parts = ["{$importer->imported} new"];
        if ($importer->duplicates > 0) {
            $parts[] = $importer->duplicates === 1
                ? '1 duplicate skipped'
                : "{$importer->duplicates} duplicates skipped";
        }
        if ($importer->skipped_other > 0) {
            $parts[] = $importer->skipped_other === 1
                ? '1 row skipped (invalid or incomplete)'
                : "{$importer->skipped_other} rows skipped (invalid or incomplete)";
        }
        $msg = 'Import finished. '.implode(', ', $parts).'.';

        return $this->returnData('import_summary', $summary, $msg, 200);
    }

     public function fileImportUpdate(Request $request) 
    {
          $rules = ['file'=> 'required|mimes:xlsx,csv,xls'];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

        $importer = new QuestionsImportUpdate;
        Excel::import($importer, $request->file('file')->store('temp'));

        $skippedTotal = $importer->duplicates_skipped + $importer->skipped_invalid;
        $summary = [
            'updated' => $importer->updated,
            'duplicates' => $importer->duplicates_skipped,
            'skipped_other' => $importer->skipped_invalid,
            'skipped' => $skippedTotal,
            'errors' => $importer->errors,
        ];

        if ($importer->updated === 0) {
            $msg = $skippedTotal > 0
                ? 'No questions were updated. Review duplicates and row issues below.'
                : 'No data rows were processed. Check the file and required columns.';

            return $this->returnData('import_summary', $summary, $msg, 200);
        }

        $parts = ["{$importer->updated} updated"];
        if ($importer->duplicates_skipped > 0) {
            $parts[] = $importer->duplicates_skipped === 1
                ? '1 duplicate skipped'
                : "{$importer->duplicates_skipped} duplicates skipped";
        }
        if ($importer->skipped_invalid > 0) {
            $parts[] = $importer->skipped_invalid === 1
                ? '1 row skipped (invalid or incomplete)'
                : "{$importer->skipped_invalid} rows skipped (invalid or incomplete)";
        }
        $msg = 'Import finished. '.implode(', ', $parts).'.';

        return $this->returnData('import_summary', $summary, $msg, 200);
    }

     public function export(Request $request) 
    {
         // return  Excel::download(new QuestionsExport, 'questions_bank_'.date('Y_m_d_h_i_s').'.xlsx');
           $name = 'questions_bank_'.date('Y_m_d_h_i_s').'.xlsx';
          Excel::store(new QuestionsExport(), $name, 'real_public');
          return response()->json([
            'status'  => true ,
            'path'=> url('/api/'.$name)
            ] , 200);
    }

     public function show($id,Request $request)
     {
       try {

                  $question = Questions::where('id',$id)->with('subject')->with('lesson')->first();
                  
                  if(!$question)
                   return $this->returnError('E001','question is not exists',400);
                  
                   $question = new questionResource($question) ;

                   return  response()->json([
                    'status'  => true ,
                    'question'=> $question,
                    ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


     public function destroy(Request $request)
     {
       try {
                    
             if(!request()->has('id'))
                return $this->returnError('E001','question id is required',400);
                  
                  QuizesQuestions::whereIN('question_id',request('id'))->delete();
                  Questions::whereIN('id',request('id'))->delete();
               
                 return $this -> returnSuccessMessage( __('api.Question Deleted Successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

}