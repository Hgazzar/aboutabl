@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}" />
{{--    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}" />--}}
{{--    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}" />--}}
@endsection
@section('content')
    <input id="game_id" value="{{ $game_id }}" hidden>
    <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
    <div class="Questions">
        <div class="question">
            <h1>Choose an Output</h1>
        </div>
        <div class="buttons" id="buttons">
            @foreach($passwords as $password)
                <a href="#" onclick="save_password('{{ $password }}')">{{ $password }}</a>
                {{--            <button onclick="alert('{{ $password }}')">{{ $password }}</button>--}}
            @endforeach
        </div>
    </div>
    <div class="hackterminal">
        <div class="background"></div>
        <div class="question">
            <h1>Choose an Output</h1>
        </div>
        <div class="buttons" id="buttons">
            @foreach($passwords as $password)
                <a href="#" onclick="save_password('{{ $password }}')">{{ $password }}</a>
                {{--            <button onclick="alert('{{ $password }}')">{{ $password }}</button>--}}
            @endforeach
        </div>
    </div>
@endsection
@section('scripts')
    <script src="{{ asset('js/student/hack.js') }}"></script>
    <script>
        function save_password(pass) {
            let game_id = document.getElementById('game_id').value
            $.ajax({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                url : "/student/question/"+game_id,
                data : {
                    'pass' : pass,
                },
                type : 'Get',
                dataType : 'json',
                success : function(result){

                }
            });
        }
    </script>
@endsection


