<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // Dashboard - Analytics
    public function home(){
        $pageConfigs = [
            'pageHeader' => true
        ];

        // $breadcrumbs = [
        //     ['link'=>"home",'name'=>__('home.Title')], ['name'=>"Home"]
        // ];

        $nodes = [
            [ 'id'=>1, 'tags'=>["green"], 'name'=>"Denny Curtis", 'title'=>"CEO" ],
            ['id'=>2, 'pid'=>1, 'name'=>"Ashley Barnett", 'title'=>"HR Manager"],
            ['id'=>3, 'pid'=>1, 'name'=>"fawzy", 'title'=>"HR Manager"]
        ];
        return view('/pages/home', [
            'pageConfigs' => $pageConfigs,
            'nodes' => $nodes,
        ]);
    }


}

