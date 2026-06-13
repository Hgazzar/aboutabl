@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/style.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}" />
@endsection
@section('content')
    <input id="game_id" value="{{ $game_id }}" hidden>
    <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
    <header class="header headerWait headerStatistics">
        <div class="container">
            <div class="logo">
                <img src="{{ asset('assets/images/animalTestImg.png') }}" alt="logo" />
                <span>ANIMALS</span>
            </div>
{{--            <button class="endBtn">END</button>--}}
        </div>
    </header>
    <main class="studentTimerContainer">
        <div class="">
            <div class="">
                <div class="studentTimer" id="timer"></div>
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/student/main.js') }}"></script>
@endsection
