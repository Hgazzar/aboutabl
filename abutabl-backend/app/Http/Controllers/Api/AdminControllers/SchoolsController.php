<?php

namespace App\Http\Controllers\Api\AdminControllers;
use App\Models\User;
use App\Models\Schools;
use App\Models\Grades;
use App\Models\Classes;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Quizes;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\subjectsSchools;
use App\Models\SubjectsGrades;
use App\Models\Token;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\LoginResource;
use App\Traits\GeneralTrait;
use Validator;
use Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use DB ;
use File ;
use Illuminate\Support\Facades\Hash;
use App\Rules\isArabic;
use App\Rules\isEnglish;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
// use App\Exports\EmployeesExport;
use App\Imports\SchoolsImport;

class SchoolsController extends Controller
{
    use GeneralTrait ;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware("can:view-schools")->only("index","show");
        $this->middleware("can:add-schools")->only("store","create");
        $this->middleware("can:edit-schools")->only("update","edit");
        $this->middleware("can:activation-schools")->only("status");
        $this->middleware("can:delete-schools")->only("destroy"); 
    }
    

     public function index(Request $request)
    {
        try {
                 $schools_count = Schools::whereIN('id',$this->SchoolsIDs())->count();
                
                 $schools_active = Schools::whereIN('id',$this->SchoolsIDs())->where('status','1')
                                  ->count();
               
                 $schools_inactive = Schools::whereIN('id',$this->SchoolsIDs())->where('status','0')
                                  ->count();
                
                 $schools_new = Schools::whereIN('id',$this->SchoolsIDs())
                                ->whereMonth('created_at', now()->month)->count();

                 $schools = DB::table('schools')
                ->leftjoin('governs', 'schools.govern_id', '=', 'governs.id')
                ->leftjoin('cities', 'schools.city_id', '=', 'cities.id')
                ->When($request->search,function($query) use($request){
                      $query->where((app()->getLocale()=='ar'?'schools.name_ar':'schools.name'),'like','%'.$request->search.'%');
                 })
                ->orderBy('schools.created_at',$request->order ?? 'desc');
              
               if(!request()->has('subject_id'))
                $schools = $schools->whereIN('schools.id',$this->SchoolsIDs());
              else
                $schools = $schools->whereIN('schools.id',$this->subjectSchool(request('subject_id')));

                $schools = $schools->select('schools.id',$this->getCurrentLang()=='ar'?'schools.name_ar as name':'schools.name','email','schools.contanct_number','schools.status','governs.name_'.app()->getLocale() .' as govern','cities.name_'.app()->getLocale() .' as city',$this->getCurrentLang()=='ar'?'schools.address_ar as address':'schools.address as address');

            if($request->has('filter_status'))
                 $schools = $schools->where('schools.status',request('filter_status'));


            if($request->has('paginate') and $request->paginate > 0)
                 $schools = $schools->paginate($request->paginate);
            else
                 $schools = $schools->get();

          return response()->json([
            'status'  => true ,
            'schools_count'=>$schools_count,
            'schools_active'=>$schools_active,
            'schools_inactive'=>$schools_inactive,
            'schools_new'=>$schools_new,
            'schools' => $schools,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store( Request $request){
        try {
            $nameEn = trim($request->input('name_en', ''));
            $nameAr = trim($request->input('name_ar', ''));
            if ($nameEn === '' && $nameAr === '') {
                return $this->returnError('E001', __('api.at_least_one_school_name_required'), 422);
            }
            $nameEn = $nameEn ?: $nameAr;
            $nameAr = $nameAr ?: $nameEn;
            $request->merge(['name_en' => $nameEn, 'name_ar' => $nameAr]);

            $rules = [
                "name_en"    => ["required","max:100","unique:schools,name"],  //,"min:4"
                "name_ar" => ["required","max:100","unique:schools,name_ar"],  //"min:4",
                "logo" => "nullable",
                "govern_id" => "nullable|exists:governs,id",
                "city_id" => "nullable|exists:cities,id",
                "address_en" => ["nullable","max:1000"],
                "address_ar" => ["nullable","max:1000"],
                "contanct_number" => "required|unique:schools,contanct_number",
                "email"      => "required|unique:schools,email",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             DB::beginTransaction();

           $logoPath = null;
           if(request()->has('logo') and !empty(request('logo')))
           {
                    $file     = request('logo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'schools';
                    $file->store('public/'.$path);
                    $logoPath = $path.'/'.$hashName;
               }
                 $schools  = Schools::create([
                          'name'      => $request->name_en,
                          'name_ar'   => $request->name_ar,
                          'contanct_number'=>$request->contanct_number,
                          'email'     =>$request->email,
                          'status'    => $request->status == '1' ? '1' : '0',
                          'address'   => $request->address_en ?? null,
                          'address_ar'=> $request->address_ar ?? null,
                          'govern_id' => $request->govern_id??0,
                          'city_id'   => $request->city_id??0,
                          'logo'      => $logoPath,
                       ]);

                 SchoolsRoles::create([
                    'role_id'        => 1,
                    'school_id'      => $schools->id
                   ]);
                
                DB::commit();

             return $this->returnData('School',Schools::find($schools->id), __('api.school_added_successfully') ,200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function update($id,Request $request){
        try {
            $nameEn = trim($request->input('name_en', ''));
            $nameAr = trim($request->input('name_ar', ''));
            if ($nameEn === '' && $nameAr === '') {
                return $this->returnError('E001', __('api.at_least_one_school_name_required'), 422);
            }
            $nameEn = $nameEn ?: $nameAr;
            $nameAr = $nameAr ?: $nameEn;
            $request->merge(['name_en' => $nameEn, 'name_ar' => $nameAr]);

            $rules = [
                "name_en"    => ["required","max:100"],   //,"min:4"
                "name_ar"    => ["required","max:100"],   //,"min:4"
                "logo"       => "nullable",
                "govern_id"  => "nullable|exists:governs,id",
                "city_id"    => "nullable|exists:cities,id",
                "address_en" => ["nullable","max:1000"],
                "address_ar" => ["nullable","max:1000"],
                "contanct_number" => "required",
                "email" => "required",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

             $school = Schools::find($id);

              if(!$school)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

             $check1 = Schools::where('id','!=',$id)->where('name',$request->name_en)->first();
             $check2 = Schools::where('id','!=',$id)->where('name_ar',$request->name_ar)->first();
             $check3 = Schools::where('id','!=',$id)->where('email',$request->email)->first();
             $check4 = Schools::where('id','!=',$id)->where('contanct_number',$request->contanct_number)->first();

            if ($check1 or $check2 or $check3 or $check4)
            {
                 return $this->returnError('E001',__('api.school has already been taken'));
            }

             DB::beginTransaction();

           if(request()->has('logo') and !empty(request('logo')))
           {
                    $file     = request('logo');
                    $f_name   = $file->getClientOriginalName();
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'schools';
                    $file->store('public/'.$path);
            }

                 $schools  = Schools::where('id',$id)->update([
                          'name'      => $request->name_en,
                          'name_ar'   => $request->name_ar,
                          'contanct_number'=>$request->contanct_number,
                          'email'     =>$request->email,
                          'address'   => $request->address_en,
                          'address_ar'=> $request->address_ar,
                          'govern_id' => $request->govern_id??0,
                          'city_id'   => $request->city_id??0,
                          'status'    => $request->status,
                          'logo'      => $request->logo ? $path.'/'.$hashName : str_replace( asset('/storage')."/","",$school->logo),
                       ]);
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.school updated successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function getUserSchool( Request $request){

        try {
           $schools  = $this->Schools();

           return $this->returnData('schools', $schools );
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function SetUserSchool( Request $request){

        try {
         
           $rules = [
                "school_id" => "required|exists:schools,id",
            ];
           
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }

            User::where('id',auth()->user()->id)->update([
                'school_id' => $request->school_id,
            ]);

          return  $this->returnSuccessMessage('success' ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }


     public function status($id,Request $request){
        try {
           
             DB::beginTransaction();

             $school = Schools::find($request->id);

             $school = Schools::find($id);

              if(!$school)
               {
                return $this->returnError('E001',__('api.not_exists_item_for_this_data'),400);
               }

              Schools::where('id',$id)->update([ 
                        'status'=> $school->status == '1'? '0' : '1',
                ]);
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.school updated successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
   
     public function destroy($id,Request $request){
        try {
          
               DB::beginTransaction();

              Schools::where('id',$id)->delete();
               
                DB::commit();

                 return $this -> returnSuccessMessage( __('api.school deleted successfully') ,"200",200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function show($id,Request $request){
        try {
            $allowedSchoolIds = array_map('intval', $this->SchoolsIDs());
            if (!in_array((int) $id, $allowedSchoolIds, true)) {
                return $this->returnError('E3002', 'Forbidden', 403);
            }

            // return asset('/storage').'/';
            $storage_url = asset('/storage').'/';
          ////////////overview/////////////////////  
           $overview      = [];
           $overview['users_count'] = User::where('school_id',$id)->where('type','user')->count();
           $overview['grades_count']  = Grades::where('school_id',$id)->count();
           $overview['classes_count'] = Classes::where('school_id',$id)->count();
           $overview['students_count']= Student::where('school_id',$id)->count();
           $overview['subjects']    = Subject::whereIN('id',$this->subjects($id))->pluck('id')->toArray();
           $overview['quizes_count']  = Quizes::whereIN('subject_id',$overview['subjects'])->count();
           $overview['subjects']      = count($overview['subjects']);
           $overview['homework_count']= 0;
           $overview['assessments_count']= 0;
           $school_details = DB::table('schools')->where('schools.id',$id)
                              ->leftjoin('governs', 'schools.govern_id', '=', 'governs.id')
                              ->leftjoin('cities', 'schools.city_id', '=', 'cities.id')
                              ->select('schools.id',$this->getCurrentLang()=='ar'?'schools.name_ar as name':'schools.name','schools.name as name_en','schools.name_ar as name_ar','schools.email','schools.contanct_number','schools.status','schools.govern_id','governs.name_'.app()->getLocale() .' as govern','governs.name_en as govern_name_en','governs.name_ar as govern_name_ar','schools.city_id','cities.name_'.app()->getLocale() .' as city','cities.name_en as city_name_en','cities.name_ar as city_name_ar','address as address_en','address_ar as address_ar','schools.logo') 
                              ->first();
            $school_details->logo = $storage_url . $school_details->logo;
          $overview['school_details'] = $school_details;

          return response()->json([
            'status'  => true ,
            'overview' => $overview,
            ] , 200);
          
        }catch (\Exception $ex){
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

   public function assignSubject($id,Request $request){
        // DB::beginTransaction();

        $rules = [
           "subject_id"     => "required|array|min:1",
           "subject_id.*"  => [
                     'numeric',
                     'exists:subjects,id',
               ],
           "grade_id"     => "nullable|array|min:1",
           "status"     => "nullable|array|min:1",
           "status.*"  => [
                     'in:0,1',
                     'numeric'
               ]
       ];
      
       $validator = Validator::make($request->all(), $rules);

       if ($validator->fails()) {
           $code = $this->returnCodeAccordingToInput($validator);
           return $this->returnValidationError($code, $validator);
       }
       foreach ($request->subject_id as $k => $s) {
         
         $subjects_schools = subjectsSchools::where('subject_id',$s)->where('school_id',$id)->first();

         if(!$subjects_schools)
           $subjects_schools = subjectsSchools::create([
                         'subject_id' => $s,
                         'school_id'  => $id,
                         'status'     => $request->status[$k]??1,
                   ]);
         
       
           if(request()->has('grade_id')){
             foreach ($request->grade_id as  $g) {
                  $check = SubjectsGrades::where('school_id',$id)
                   ->where('subject_id',$s)
                   ->where('grade_id',$g)
                   ->count();

                  if($check != 0)
                  {
                    return $this->returnError('E001',__('api.This subject was assigned by the same grade and the same school as before'),400);
                  }
                  else
                  {
                     SubjectsGrades::create([
                            'subjects_schools_id'=>$subjects_schools->id,
                             'grade_id'          =>$g,
                             'subject_id'        =>$s,
                             'school_id'         =>$id,
                             'status'            =>$request->status[$k]??1,
                     ]); 
                  }
            }
          }
       }
       // DB::commit();
       
       return $this -> returnSuccessMessage( __('api.school updated successfully') ,"200",200);
   }
    
    public function fileImport(Request $request) 
    {

          $rules = ['file'=> 'required|mimes:xlsx,csv,xls'];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);
                return $this->returnValidationError($code, $validator);
            }
            
        Excel::import(new SchoolsImport(), $request->file('file')->store('temp'));
         return $this -> returnSuccessMessage('Schools Added Successfully' ,"200",200);
    }

}