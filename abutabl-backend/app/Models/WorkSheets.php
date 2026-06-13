<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkSheets extends Model
{
    use HasFactory;
    protected $guarded = [];
    // protected $fillable =[
    //         'name_en',
    //         'name_ar',
    //         'des_en',
    //         'des_ar',
    //         'status',
    //         'code',
    //         'subject_id',
    //         'created_by',
    //         'file',
    //         'size',
    //         'path',
    //         'ext',
    //         'file_name',
    //         'file_hash_name',
    //         'background'
    //       ];
    public function getCreatedAtAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }
    public function getBackgroundAttribute($val)
    {
        if ($val){
            return asset('/storage')."/".$val;
        } else {
            return asset('/')."images/logo/site_logo.png";
        }
    }
    public function getPathAttribute($val)
    {
        return asset('/').$val;
    }
    
    public function questions()
    {
        return $this->hasMany(WorkSheetsQuestions::class,'work_sheet_id','id');
    }
}
