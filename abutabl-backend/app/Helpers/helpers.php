<?php // Code within app\Helper.php

namespace App\Helpers;
use Config;
use Illuminate\Support\Str;
use Auth;
use DB ;
use File ;
class Helper
{
    public static function applClasses()
    {
        $data = config('custom.custom');
        $layoutClasses = [
            'theme' => $data['theme'],
            'sidebarCollapsed' => $data['sidebarCollapsed'],
            'navbarColor' => $data['navbarColor'],
            'menuType' => $data['menuType'],
            'navbarType' => $data['navbarType'],
            'navbarClass' => '',
            'footerType' => $data['footerType'],
            'sidebarClass' => 'menu-expanded',
            'bodyClass' => $data['bodyClass'],
            'pageHeader' => $data['pageHeader'],
            'blankPage' => $data['blankPage'],
            'blankPageClass' => '',
            'contentLayout' => $data['contentLayout'],
            'sidebarPositionClass' => '',
            'contentsidebarClass' => '',
            'mainLayoutType' => $data['mainLayoutType'],
            'direction' => $data['direction'],
         ];



        //Theme
        if($layoutClasses['theme'] == 'dark')
            $layoutClasses['theme'] = "dark-layout";
        elseif($layoutClasses['theme'] == 'semi-dark')
            $layoutClasses['theme'] = "semi-dark-layout";
        else
            $layoutClasses['theme'] = "light";

        //menu Type
        switch($layoutClasses['menuType']){
            case "static":
                $layoutClasses['menuType'] = "menu-static";
                break;
            default:
                $layoutClasses['menuType'] = "menu-fixed";
        }

        //navbar
        switch($layoutClasses['navbarType']){
            case "static":
                $layoutClasses['navbarType'] = "navbar-static";
                $layoutClasses['navbarClass'] = "navbar-static-top";
                break;
            case "sticky":
                $layoutClasses['navbarType'] = "navbar-sticky";
                $layoutClasses['navbarClass'] = "fixed-top";
                break;
            case "hidden":
                $layoutClasses['navbarType'] = "navbar-hidden";
                break;
            default:
                $layoutClasses['navbarType'] = "navbar-floating";
                $layoutClasses['navbarClass'] = "floating-nav";
        }

        // sidebar Collapsed
        if($layoutClasses['sidebarCollapsed'] == 'true')
            $layoutClasses['sidebarClass'] = "menu-collapsed";

        // sidebar Collapsed
        if($layoutClasses['blankPage'] == 'true')
            $layoutClasses['blankPageClass'] = "blank-page";

        //footer
        switch($layoutClasses['footerType']){
            case "sticky":
                $layoutClasses['footerType'] = "fixed-footer";
                break;
            case "hidden":
                $layoutClasses['footerType'] = "footer-hidden";
                break;
            default:
                $layoutClasses['footerType'] = "footer-static";
        }

        //Cotntent Sidebar
        switch($layoutClasses['contentLayout']){
            case "content-left-sidebar":
                $layoutClasses['sidebarPositionClass'] = "sidebar-left";
                $layoutClasses['contentsidebarClass'] = "content-right";
                break;
            case "content-right-sidebar":
                $layoutClasses['sidebarPositionClass'] = "sidebar-right";
                $layoutClasses['contentsidebarClass'] = "content-left";
                break;
            case "content-detached-left-sidebar":
                $layoutClasses['sidebarPositionClass'] = "sidebar-detached sidebar-left";
                $layoutClasses['contentsidebarClass'] = "content-detached content-right";
                break;
            case "content-detached-right-sidebar":
                $layoutClasses['sidebarPositionClass'] = "sidebar-detached sidebar-right";
                $layoutClasses['contentsidebarClass'] = "content-detached content-left";
                break;
            default:
                $layoutClasses['sidebarPositionClass'] = "";
                $layoutClasses['contentsidebarClass'] = "";
        }

        return $layoutClasses;
    }
    
    public static function callJumia($service , $number)
    {

        if($service == "we")
        {
            $service_key = "internet.postpaid.wehome@aman" ;
            $integrity_key  =  "19ef610d2e8588e883a3148ba272e0556cc99c25" ;
            $phone_number_message = '"phone_number_message":"For landline numbers, you must enter the governate code",' ;
            $elements = '[
                {
                    "key": "phone_number_message",
                    "label": "For landline numbers, you must enter the governate code",
                    "options": [],
                    "template": "message",
                    "title": "",
                    "validators": []
                },
                {
                    "key": "phone_number",
                    "label": "Phone Number",
                    "options": [
                        {
                            "form_elements": [],
                            "icon": "",
                            "label": "Egypt",
                            "message": "",
                            "option_value": "EG_+20",
                            "preselected": false
                        }
                    ],
                    "template": "phone_with_country",
                    "title": "What is your phone number?",
                    "validators": [
                        {
                            "message": "Phone Number is required",
                            "options": [],
                            "type": "required"
                        },
                        {
                            "message": "Invalid phone number",
                            "options": [],
                            "type": "phoneNumber"
                        }
                    ]
                }
            ]';
        }elseif($service == "orange"){
            $service_key = "internet.bill.orangedsl@fawry";
            $integrity_key  =  "855ec6a36fb423ffd715860f4bb712aad7c3db27" ;
            $phone_number_message = '"phone_number_message":"For landline numbers, you must enter the governate code",' ;
            $elements = '[
                {
                    "key": "phone_number_message",
                    "label": "For landline numbers, you must enter the governate code",
                    "options": [],
                    "template": "message",
                    "title": "",
                    "validators": []
                },
                {
                    "key": "phone_number",
                    "label": "Phone Number",
                    "options": [
                        {
                            "form_elements": [],
                            "icon": "",
                            "label": "Egypt",
                            "message": "",
                            "option_value": "EG_+20",
                            "preselected": false
                        }
                    ],
                    "template": "phone_with_country",
                    "title": "What is your phone number?",
                    "validators": [
                        {
                            "message": "Phone Number is required",
                            "options": [],
                            "type": "required"
                        },
                        {
                            "message": "Invalid phone number",
                            "options": [],
                            "type": "phoneNumber"
                        }
                    ]
                }
            ]';
        }elseif($service == "noor"){
            $service_key = "internet.bill.nooradsl@fawry";
            $integrity_key  =  "0171cda40c088fd6bbb4b9f665a83c5a8596a32c" ;
            $phone_number_message = '"phone_number_message":"For landline numbers, you must enter the governate code",' ;
            $elements = '[
                {
                    "key": "phone_number_message",
                    "label": "For landline numbers, you must enter the governate code",
                    "options": [],
                    "template": "message",
                    "title": "",
                    "validators": []
                },
                {
                    "key": "phone_number",
                    "label": "Phone Number",
                    "options": [
                        {
                            "form_elements": [],
                            "icon": "",
                            "label": "Egypt",
                            "message": "",
                            "option_value": "EG_+20",
                            "preselected": false
                        }
                    ],
                    "template": "phone_with_country",
                    "title": "What is your phone number?",
                    "validators": [
                        {
                            "message": "Phone Number is required",
                            "options": [],
                            "type": "required"
                        },
                        {
                            "message": "Invalid phone number",
                            "options": [],
                            "type": "phoneNumber"
                        }
                    ]
                }
            ]';
        }elseif($service == "etisalat"){
            $service_key    = "internet.postpaid.etisalat@aman";
            $integrity_key  =  "f5f99f2cbae1f72090c3b560b858b65387446b5b" ;
            $phone_number_message = "" ;
            $elements = '[
                {
                    "key": "phone_number",
                    "label": "رقم الهاتف",
                    "options": [
                        {
                            "form_elements": [],
                            "icon": "",
                            "label": "Egypt",
                            "message": "",
                            "option_value": "EG_+20",
                            "preselected": false
                        }
                    ],
                    "template": "phone_with_country",
                    "title": "ما هو رقم هاتفك؟",
                    "validators": [
                        {
                            "message": "‎رقم الهاتف‎ مطلوب",
                            "options": [],
                            "type": "required"
                        },
                        {
                            "message": "رقم هاتف غير صالح",
                            "options": [],
                            "type": "phoneNumber"
                        }
                    ]
                }
            ]';
        }
        $curl   = curl_init();
        $_data  = '{
            "service_key": "'.$service_key.'",
            "payload": {
                '.$phone_number_message.'
                "phone_number": "EG_+20'.$number.'"
            },
            "form_segments": [
                {
                    "service_key": "'.$service_key.'",
                    "elements": '.$elements.',
                    "step": 1,
                    "step_count": 2,
                    "payload": [],
                    "integrity_key": "'.$integrity_key.'"
                }
            ]
        }';
        curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://pay.jumia.com.eg/api/v3/utilities/service-form-type/'.$service_key,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $_data ,
        CURLOPT_HTTPHEADER => array(
            'accept-language: ar',
            'cookie: ',
            'Content-Type: application/json'
        ),
        ));

        $response = curl_exec($curl);

        curl_close($curl);
        $response_code = curl_getinfo($curl, CURLINFO_HTTP_CODE) ;
        if($response_code != 200)
        {
            $res = json_decode($response, TRUE);
            if( isset($res['response']) && $res['response'] == 'You probably have no bill to pay. Please try again later' )
            {
                $response_code = 200 ;
            }
        }
        Phones::Where('phone', 'like', '%' . $number . '%')->update(['data' => $_data]) ;
        return $response_code ;

    }
    
    public static function updatePageConfig($pageConfigs){
        $demo = 'custom';
        if(isset($pageConfigs)){
            if(count($pageConfigs) > 0){
                foreach ($pageConfigs as $config => $val){
                    Config::set('custom.'.$demo.'.'.$config, $val);
                }
            }
        }
    }

    public static function getLanguages(){
        return ['ar','en'];
    }
     

    public static function getPagination(){
         return request('paginate') ?? Constants::DASHBOARD_PAGINATION;
    }
     

    public static function getCurrentLang(){
      return App()->getlocale();
    }

    public static function GetUserName($id){
        if(intval($id) != 0){
             $user =  User::find($id);
             if($user)
               return $user;
        }
    }
    
   public static function GetRowName($table,$val,$col){
        $result = DB::table($table)->Where($col,$val)->first();
        if($result)
        {
            return $result->id;
        }
        return Null ;
    }

   public static function GetAnswerData($val,$from=""){
       if($val == Null or $val == "" or $val == " ")
        return "";
    
        $arr    = explode(',',$val);
        $result = "";
        $extensions = ['jpeg','png','svg','jpeg','jpg','gif','apng','webp','mp3','mp4','3gb','mp4','ogg','webm','pdf'];
        foreach ($arr as $key => $value) {
            if(str_contains($value,'.') and in_array(explode('.', $value)[1],$extensions))
            {
             if($from != 'model'){
               $media = DB::table('file_management')->Where('name',explode('.', $value)[0])
                           ->where('type',explode('.', $value)[1])->first();
                if($media)
                {
                    $result.= url('/storage').'/'.$media->path;
                    if($key+1 != count($arr))
                        $result.=',';
                }
                else
                {
                    $result.=$value;
                    if($key+1 != count($arr))
                        $result.=',';
                }
             }
            }
            else
            {
                 $result.=$value;
                    if($key+1 != count($arr))
                        $result.=',';
            }
        }
        
        if($result[strlen($result)-1] == ',')
        {
            $result = substr($result, 0, -1);
        }
        return $result ;
    }

 public static function GetAnswerDataArray($val,$from=""){
       if($val == Null or $val == "" or $val == " ")
        return "";
    
        $arr    = explode(',',$val);
        $result = [];
        $extensions = ['jpeg','png','svg','jpeg','jpg','gif','apng','webp','mp3','mp4','3gb','mp4','ogg','webm','pdf'];
        $type=['png'=>'image','jpeg'=>'image','svg'=>'image','jpeg'=>'image','jpg'=>'image','mp3'=>'audio','mp4'=>'video'];
        foreach ($arr as $key => $value) {
            if(str_contains($value,'.') and in_array(explode('.', $value)[1],$extensions))
            {
                $media = DB::table('file_management')->Where('name',explode('.', $value)[0])
                           ->where('type',explode('.', $value)[1])->first();
                if($media)
                {
                     $result[$key]=['text'=> url('/storage').'/'.$media->path,'type'=>"file","ext"=>isset($type[$media->type])?$type[$media->type]:$media->type];
                }
                else
                {
                     $result[$key]= ['text'=>$value,'type'=>"text","ext"=>""];
                }
            }
            else
            {
                 $result[$key]= ['text'=>$value,'type'=>"text","ext"=>""];
            }
        }
        
        return $result ;
    }

  public static function uploadQuestion()
    {
        if(request()->has('questionBodyType') and request()->has('question'))
        {
            if(request('questionBodyType') == 'text')
            {
                return request('question');
            }
            elseif(request('questionBodyType') == 'file' and request()->hasFile('question'))
            {
                 $file     = request('question');
                 $f_name   = explode('.',$file->getClientOriginalName())[0];
                 $result = DB::table('file_management')->Where('name',$f_name)->first();
                 if(!$result)
                 {
                        $hashName = $file->hashName();
                        $size     = $file->getSize();
                        $ext      = $file->extension();
                        $path     = 'files_maanger';
                          
                        $file->store('public/'.$path); 
                   
                        $fm =  \App\Models\FileManagement::create([
                              'name'     => $f_name,
                              'hashName' => $hashName,
                              'type'     => $ext,
                              'size'     => $size,
                              'path'     => $path,
                              'created_by'  => auth()->user()->id,
                            ]);
                      return $fm->id;
                 }
                 else
                 {
                    return $result->id;
                 }
            }
            elseif(request('questionBodyType') == 'file' and !request()->hasFile('question'))
            {
                $result = DB::table('file_management')->Where('name',request('question'))->first();

                if($result)
                    return $result->id;
            }
        }

        return null;
    }
    
  public static function uploadAnswer($num)
    {
        if(request()->has('answerBodyType') and request()->has('answer'.$num))
        {
            if(request('answerBodyType') == 'text')
            {
                return request('answer'.$num);
            }
            elseif(request('answerBodyType') == 'file' and request()->hasFile('answer'.$num))
            {
                    $file     = request('answer'.$num);
                    $f_name   = explode('.',$file->getClientOriginalName())[0];
                    $hashName = $file->hashName();
                    $size     = $file->getSize();
                    $ext      = $file->extension();
                    $path     = 'files_maanger';
                      
                    $file->store('public/'.$path); 
               
                    $fm =  \App\Models\FileManagement::create([
                          'name'     => $f_name,
                          'hashName' => $hashName,
                          'type'     => $ext,
                          'size'     => $size,
                          'path'     => $path,
                          'created_by'  => auth()->user()->id,
                        ]);
                  return $fm->id;
            }
            elseif(request('questionBodyType') == 'file' and !request()->hasFile('answer'.$num))
            {
              $result = DB::table('file_management')->Where('name',request('answer'.$num))->first();

                if($result)
                    return $result->id;
            }
        }

        return null;
    }

  public static function GetAnswerExtension($val){
        $arr    = explode(',',$val);
        $result = "";
        $extensions = ['jpeg','png','svg','jpeg','jpg','gif','apng','webp','mp3','mp4','3gb','mp4','ogg','webm','pdf'];
        $type=['png'=>'image','jpeg'=>'image','svg'=>'image','jpeg'=>'image','jpg'=>'image','mp3'=>'audio','mp4'=>'video'];
        foreach ($arr as $key => $value) {
         if(str_contains($value,'.') and in_array(explode('.', $value)[1],$extensions))
            {
               $media = DB::table('file_management')->Where('name',explode('.', $value)[0])
                           ->where('type',explode('.', $value)[1])->first();
                if($media)
                {
                    return isset($type[$media->type])?$type[$media->type]:$media->type;
                }
                else
                {
                   return "text";
                }
             }
            else
            {
                 return "text";
            }
        }
        
       return "text";
    }

    /**
     * Remove the jQuery/start-overlay auto-click script block from SCORM HTML if present.
     * Returns the cleaned HTML content.
     */
    public static function removeScormStartOverlayScript(string $html): string
    {
        $block = '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
                                <script>
                                    $(document).ready(function() {
                                        setInterval(function () {
                                            $(".start-overlay>button").click();
                                        }, 1);
                                    });
                                </script>';
        $html = str_replace($block, '', $html);
        // Also remove if whitespace differs (e.g. already minified or different indentation)
        $pattern = '/\s*<script\s+type="text\/javascript"\s+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery\/3\.7\.1\/jquery\.min\.js"\s*><\/script>\s*<script>\s*\$\(document\)\.ready\s*\(\s*function\s*\(\s*\)\s*\{\s*setInterval\s*\(\s*function\s*\(\s*\)\s*\{\s*\$\(["\']\.start-overlay\s*>\s*button["\']\)\.click\s*\(\s*\)\s*;\s*\}\s*,\s*1\s*\)\s*;\s*\}\s*\)\s*;\s*<\/script>\s*/s';
        return preg_replace($pattern, '', $html);
    }
}