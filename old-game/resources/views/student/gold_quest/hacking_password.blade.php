@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}" />
{{--    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}" />--}}
{{--    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}" />--}}
@endsection
@section('content')
    <input id="game_id" value="{{ $game_id }}" hidden>
    <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
    <?php
    function generatePassword($length = 12)
    {
        // Define character sets
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
//              $symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Combine all characters
        $allChars = $uppercase . $lowercase . $numbers;

        // Ensure at least one character from each set
        $password = $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];
//              $password .= $symbols[random_int(0, strlen($symbols) - 1)];

        // Fill remaining length with random characters
        for ($i = 0; $i < $length - 4; $i++) {
            $password .= $allChars[random_int(0, strlen($allChars) - 1)];
        }

        // Shuffle to randomize the order
        return str_shuffle($password);
    }

    // Generate 3 passwords
    $passwords = [];
    for ($i = 0; $i < 5; $i++) {
        $passwords[] = generatePassword(6); // 12-character length
    }
    ?>
    <input id="game_id" value="{{ $game_id }}" hidden>
    <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
    <div class="hackterminal">
        <div class="background"></div>

        <div class="terminal" id="terminal"></div>
        <div class="buttons" id="buttons">
            @foreach($passwords as $password)
                <a href="/student/save_password/{{ $game_id }}/{{ $password }}">{{ $password }}</a>
                {{--            <button onclick="alert('{{ $password }}')">{{ $password }}</button>--}}
            @endforeach
        </div>
    </div>
@endsection
@section('scripts')
    <script src="{{ asset('js/student/hack.js') }}"></script>
    <script>
        localStorage.removeItem("countdownEndTime");
        localStorage.removeItem("current_question")
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


