@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/teacher/style.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/normalize.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/all.min.css') }}"/>
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
                <input id="game_id" value="{{ $game_id }}" hidden>
                <img src="/{{ $game->logo }}" alt="logo" />
                <span>{{ $game->name }}</span>
            </div>
            <div class="timer">
                <img src="{{ asset('assets/icons/alarm.svg') }}" alt="alarm" />
                <div class="time">
                    <span class="minutes">{{ (int)(explode(':', $game->time)[0]) }}</span>:<span class="seconds">00</span>
                </div>
            </div>
            <a href="/teacher/facts/{{$game_id}}" class="endBtn">END</a>
{{--            <button class="endBtn">END</button>--}}
        </div>
    </header>
    <main>
        <div class="container">
            <div class="listpracticipants mainWaiting">
                <div class="numpracticipants">
                    <img src="{{ asset('assets/icons/people.svg') }}" alt="groupPeople" />
                    <span>( <span id="students_count"></span> ) practicipants</span>
                </div>
                <div class="ListStudents">
                    <table>
                        <thead>
                        <tr>
                            <td>Rank</td>
                            <td>Name</td>
                            <td>Score</td>
                        </tr>
                        </thead>
                        <tbody id="statistics_online_students">
{{--                        <tr>--}}
{{--                            <td>1</td>--}}
{{--                            <td class="personData">--}}
{{--                                <img--}}
{{--                                    src="{{ asset('assets/icons/person.svg') }}"--}}
{{--                                    alt="person-icon"--}}
{{--                                    class="person-icon"--}}
{{--                                />--}}
{{--                                <span>student name</span>--}}
{{--                            </td>--}}
{{--                            <td class="personScore"><span>5</span>/<span>10</span></td>--}}
{{--                        </tr>--}}
{{--                        <tr>--}}
{{--                            <td>2</td>--}}
{{--                            <td class="personData">--}}
{{--                                <img--}}
{{--                                    src="{{ asset('assets/icons/person.svg') }}"--}}
{{--                                    alt="person-icon"--}}
{{--                                    class="person-icon"--}}
{{--                                />--}}
{{--                                <span>student name</span>--}}
{{--                            </td>--}}
{{--                            <td class="personScore"><span>5</span>/<span>10</span></td>--}}
{{--                        </tr>--}}
{{--                        <tr>--}}
{{--                            <td>3</td>--}}
{{--                            <td class="personData">--}}
{{--                                <img--}}
{{--                                    src="{{ asset('assets/icons/person.svg') }}"--}}
{{--                                    alt="person-icon"--}}
{{--                                    class="person-icon"--}}
{{--                                />--}}
{{--                                <span>student name</span>--}}
{{--                            </td>--}}
{{--                            <td class="personScore"><span>5</span>/<span>10</span></td>--}}
{{--                        </tr>--}}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/teacher/main.js') }}"></script>
@endsection
