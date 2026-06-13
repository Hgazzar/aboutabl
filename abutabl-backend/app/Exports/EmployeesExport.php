<?php

namespace App\Exports;

use App\Models\Student;
use App\Models\User;
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

class EmployeesExport implements FromCollection ,WithMapping , WithHeadings
{
 /**
    * @return \Illuminate\Support\Collection
    */
   public function collection()
   {
     
        $employees = User::with(['role', 'govern', 'city'])->where('users.school_id',request('school_id'));
        // dd($employees[0]->govern);

       return $employees
                  ->orderBy('created_at','asc')
                //   ->select('students.id',app()->getLocale()=='ar'?'students.name_ar as name':'students.name as name','grades.name  as grade','classes.name as class','schools.name as school','students.status','f.name as fatherName','f.NID as fatherNID','f.email as fatherEmail','f.phone as fatherPhone','jf.name_'.app()->getLocale().' as fatherJob','m.name as matherName','f.NID as matherNID','m.email as matherEmail','f.phone as matherPhone','jm.name_'.app()->getLocale().' as matherJob',"students.username","students.address","students.defaultPassword","students.birthday as birthDate","students.email")
                  ->groupBy('id')
                  ->get();
   }


   public function map($employee): array
   {

       return [
           
            $employee->name,
            $employee->name_ar,
            // $employee->lname_en,
            // $employee->lname_ar,
            $employee->role ? $employee->role->name : '',
            $employee->email,
            $employee->phone,
            $employee->govern ? $employee->govern->name_en : '',
            $employee->city ? $employee->city->name_en : '',
            $employee->username,
            $employee->joining_date,
            $employee->defaultPassword,
            // $employee->matherName,
            // $employee->matherNID,
            // $employee->matherEmail,
            // $employee->matherPhone,
            // $employee->matherJob,
            // $employee->address,
            // $employee->birthDate,
           
       ];
   }

   public function headings(): array
   {

       return [
           "Full name [English]","Full name [Arabic]", "role","Email","Phone","Government" , "City","Username", "joining_date","password"
           // ,"fatherEmail","fatherPhone","fatherJob","matherName","matherNID","matherEmail","matherPhone","matherJob","address", "birthDate"
         ];
   }
}
