<?php

namespace App\Exports;

use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectsGrades;
use App\Models\TeachersGrades;
use App\Models\AssignsStudents;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\FromQuery;
use App\Helpers\Helper;
use Illuminate\Support\Facades\Date;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\WithHeadings;
use File ;

class StudentsExport implements FromCollection ,WithMapping , WithHeadings
{
 /**
    * @return \Illuminate\Support\Collection
    */
   public function collection()
   {
     
        $students = DB::table('students')->where('students.school_id',request('school_id'));

               if(request()->has('grade_id'))
                $students = $students->where('students.grade_id',request('grade_id'));
               
               if(request()->has('class_id'))
                $students = $students->where('students.class_id',request('class_id'));

               if(request()->has('subject_id'))
               {
               	   $subject = Subject::where('id',request('subject_id'));
               
                   $subject_grades = SubjectsGrades::where('subject_id',request('subject_id'))->where('school_id',request('school_id'))->pluck('grade_id')->toArray();
               
	                $subject_classes=TeachersGrades::where('subject_id',request('subject_id'))->where('school_id',request('school_id'))->whereIN('grade_id',$subject_grades)->pluck('class_id')->toArray();
	              
	                $sudentsByClasses = Student::where('school_id',request('school_id')) 
	                         ->whereIN('students.class_id',$subject_classes)->pluck('id')->toArray(); 

	                $sudentsByAssigns = AssignsStudents::where('type','subjects')
	                                ->where('school_id',request('school_id')) 
	                                ->where('type_id',request('subject_id'))->pluck('student_id')->toArray(); 

	                $studentsSchools  = array_merge($sudentsByClasses,$sudentsByAssigns);

	                $students = $students->whereIN('students.id',$studentsSchools) ;
               }
              

       return $students->leftjoin('schools', 'students.school_id', '=', 'schools.id')
                         ->leftjoin('grades', 'students.grade_id', '=', 'grades.id')
                         ->leftjoin('classes', 'students.class_id', '=', 'classes.id')
                         ->join("student_families as f",function($join){
                            $join->on("f.student_id","=","students.id")
                                ->where("f.relation","=","father");
                         })
                        ->join("student_families as m",function($join){
                            $join->on("m.student_id","=","students.id")
                                ->where("m.relation","=","mather");
                         })
                         ->leftJoin('jobs_types as jf',function($query){
		                      $query->on("jf.id","=","f.job_id")->where('f.job_id','!=','0');
		                   })
		                  ->leftJoin('jobs_types as jm',function($query){
		                      $query->on("jm.id","=","m.job_id")->where('m.job_id','!=','0');
		                  })
                         ->When(request('search'),function($query) {
                                $query->where('students.name','like','%'.request('search').'%')
                                ->orwhere('students.name_ar','like','%'.request('search').'%')
                                ->orwhere('students.username','like','%'.request('search').'%')
                                ->orwhere('grades.name','like','%'.request('search').'%')
                                ->orwhere('classes.name','like','%'.request('search').'%');
                            })
                  ->orderBy('students.created_at','asc')
                  ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name','grades.name  as grade','classes.name as class','schools.name as school','students.status','f.name as fatherName','f.NID as fatherNID','f.email as fatherEmail','f.phone as fatherPhone','jf.name_'.app()->getLocale().' as fatherJob','m.name as matherName','f.NID as matherNID','m.email as matherEmail','f.phone as matherPhone','jm.name_'.app()->getLocale().' as matherJob',"students.username","students.address","students.defaultPassword","students.birthday as birthDate","students.email")
                  ->groupBy('students.id')
                  ->get();
   }


   public function map($student): array
   {

       return [
           
            $student->name,
            $student->fatherName,
            $student->grade,
            $student->class,
            $student->email,
            $student->username,
            $student->defaultPassword,
            // $student->fatherNID,
            // $student->fatherEmail,
            // $student->fatherPhone,
            // $student->fatherJob,
            // $student->matherName,
            // $student->matherNID,
            // $student->matherEmail,
            // $student->matherPhone,
            // $student->matherJob,
            // $student->address,
            // $student->birthDate,
           
       ];
   }

   public function headings(): array
   {

       return [
           "firstName","lastName","grade" , "class","email", "code","password"
           // ,"fatherEmail","fatherPhone","fatherJob","matherName","matherNID","matherEmail","matherPhone","matherJob","address", "birthDate"
         ];
   }
}
