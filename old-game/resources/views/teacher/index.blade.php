@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/teacher/style.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/normalize.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/all.min.css') }}"/>
@endsection
@section('content')
    <header class="header">
        <div class="contentHeader">
            <h1>Select today’s subject</h1>
            <span>chose live game</span>
        </div>
    </header>
    <main>
        <div class="mainGames">
            <input id="game_id" value="{{ $game_id }}" hidden>
            <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
            <a href="/teacher/waiting/{{$game_id}}" class="boxGame">
                <img src="/{{ $game->logo }}" alt="game-img"/>
                <span>ANIMALS</span>
            </a>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/teacher/main.js') }}"></script>
@endsection
