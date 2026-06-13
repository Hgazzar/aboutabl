@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/style.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}" />
    @if($game->type == 'hacking')
        <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}"/>
    @endif
    @if($game->type == 'gold_quest')
        <link rel="stylesheet" href="{{ asset('css/student/gold_quest.css') }}"/>
    @endif
@endsection
@section('content')
    <input id="game_id" value="{{ $game_id }}" hidden>
    <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
    <header class="header headerWait headerStatistics">
        <div class="container">
            <div class="logo">
                <img src="/{{ $game->logo }}" alt="logo"/>
                <span>{{ $game->name }}</span>
            </div>
            <div class="student_numpracticipants">
                <img src="{{ asset('assets/icons/people.svg') }}" alt="groupPeople"/>
                <span>( <span id="another_students_count"></span> ) Waiting hots to start</span>
            </div>
{{--            <button class="endBtn">END</button>--}}
        </div>
    </header>
    <main>
        <div class="container">
            <div class="studentList" id="another_students">
{{--                <div class="studentCard">--}}
{{--                    <img src="{{ asset('assets/icons/person.svg') }}" alt="person" class="studentPerson"/>--}}
{{--                    <span>student name</span>--}}
{{--                </div>--}}
{{--                <div class="studentCard">--}}
{{--                    <img src="{{ asset('assets/icons/person.svg') }}" alt="person" class="studentPerson"/>--}}
{{--                    <span>student name</span>--}}
{{--                </div>--}}
{{--                <div class="studentCard">--}}
{{--                    <img src="{{ asset('assets/icons/person.svg') }}" alt="person" class="studentPerson"/>--}}
{{--                    <span>student name</span>--}}
{{--                </div>--}}
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/student/main.js') }}"></script>
    @if($game->type == 'hacking')
        <script src="{{ asset('js/student/hack.js') }}"></script>
    @endif
@endsection
