@extends('layouts/contentLayoutMaster')

@section('title',__('home.Title'))

@section('page-style')
        <!-- Page css files -->
        <script src="https://balkangraph.com/js/OrgChart.js"></script>

        <link rel="stylesheet" href="{{ asset('css/pages/card-analytics.css') }}">
        <link rel="stylesheet" href="{{ asset('css/plugins/tour/tour.css') }}">
        <link rel="stylesheet" href="{{ asset('tree/css/template.css') }}">
  @endsection

  @section('content')
  <section id="contextual-colors" class="card ">
       
        <div class="card-content">
          <div class="card-body">
                <div id="tree">

                </div>
          </div>
          

        </div>
      </section>
  @endsection



