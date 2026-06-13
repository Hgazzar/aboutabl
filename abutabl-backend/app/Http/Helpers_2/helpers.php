<?php // Code within app\Helper.php

namespace App\Http\Helpers;

use App\Models\Phones;

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
    public static function GetPhonesStatus()
    {
        return array(
            '2'  => __('main.status2'),
            '1'  => __('main.status1'),
            '-1' => __('main.status-1'),
        );
    }
    public static function PhonesStatus()
    {
        return array(
            '2'  => 2,
            '1'  => 1,
            '-1' => -1,
        );
    }
    
}