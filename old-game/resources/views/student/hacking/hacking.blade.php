@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/style.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}" />
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
            <div class="timer">
                <img src="{{ asset('assets/icons/alarm.svg') }}" alt="alarm"/>
                <div class="time">
                    <span class="minutes">{{ (int)(explode(':', $game->time)[0]) }}</span>:<span
                        class="seconds">00</span>
                </div>
            </div>
            <div style="display: flex;justify-content: center;align-items: center;gap: 8px;">
                <span id="student_coins" style="font-size: 25px;">{{ auth()->user()->games_coins }}</span>
                <img style="width: 25px;" src="{{ asset('assets/icons/coin.png') }}">
            </div>
        </div>
    </header>
    <main>
        <div class="container">
            <div class="hackterminal">
                <div class="background"></div>
                <div class="question" style="text-align: center;margin: auto;margin-bottom: 50px;">
                    <h1>Guest Correct Password</h1>
                </div>
                <div class="answers" style="width: 57%;margin: auto;">
                    <input id="correct_pass" hidden value="{{ $student_pass->game_password }}">
                    @foreach($passwords as $index=>$password)
                        <div class="answerCard passwordAnswerCard" id="passwordAnswerCard{{$index}}"
                             onclick="guest_password('{{$password}}', '{{$index}}')" style="height: 70px;">
                            {{ $password }}
                        </div>
                    @endforeach
                </div>
                <div id="show_correct_answer">
                </div>
{{--                <div class="buttons" id="buttons1" style="display: block; text-align: center; margin: 20px 0;">--}}
{{--                    @foreach($passwords as $password)--}}
{{--                        <a href="#" onclick="save_password('{{ $password }}')">{{ $password }}</a>--}}
{{--                        --}}{{--            <button onclick="alert('{{ $password }}')">{{ $password }}</button>--}}
{{--                    @endforeach--}}
{{--                </div>--}}
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/student/main.js') }}"></script>
    <script src="{{ asset('js/student/hack.js') }}"></script>
    <script>
        const passwordAnswerCard = document.querySelectorAll(".passwordAnswerCard");
        function guest_password(pass, index) {
            passwordAnswerCard.forEach((otherImg) => {
                otherImg.style.pointerEvents = "none"; // Disable further clicks
            });
            let correct_pass = document.getElementById('correct_pass').value
            if (pass === correct_pass) {
                // إضافة فئة successAnswer
                document.getElementById('passwordAnswerCard'+index).classList.add("successAnswer");
                $('#show_correct_answer').empty()
                $('#show_correct_answer').append(`
                    <div class="question" style="margin-top: 30px;height: auto;display: grid;padding-bottom: 10px;padding-top: 10px;max-width: max-content;align-items: center;margin: auto;margin-top: 50px;">
                        <h1>Student Password Hacking: <span style="text-transform: capitalize;">{{$student_pass->name}}</span></h1>
                    </div>
                `)
                $.ajax({
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    url: "/student/gift/save",
                    data: {
                        'student_id': '{{$student_pass->id}}'
                    },
                    type: 'POST',
                    dataType: 'json',
                    success: function (result) {
                        setTimeout(function() {
                            // window.location.href = '/student/question/' + game_id;
                        }, 1500)
                    }
                })
            } else {
                // إضافة فئة wrongAnswer
                document.getElementById('passwordAnswerCard'+index).classList.add("wrongAnswer");
                window.location.href = '/student/question/' + game_id;
            }

            for (let i = 0; i < 5; i++) {
                console.log(i)
                if (i !== parseInt(index)) {
                    console.log(index)
                    document.getElementById('passwordAnswerCard' + i).classList.remove("successAnswer", "wrongAnswer");
                }
            }
        }
    </script>
@endsection
