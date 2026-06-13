<?php // Code within app\Helper.php

namespace App;

use App\Models\Phones;

class Helper
{
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
    
}