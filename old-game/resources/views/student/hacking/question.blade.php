@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/style.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/styleNew.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}"/>
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
            {{--            <div class="btnsgroup">--}}
            {{--                <button class="endBtn">END</button>--}}
            {{--                <button class="musicBtn">--}}
            {{--                    <svg--}}
            {{--                        fill="#fff"--}}
            {{--                        version="1.1"--}}
            {{--                        id="Capa_1"--}}
            {{--                        xmlns="http://www.w3.org/2000/svg"--}}
            {{--                        xmlns:xlink="http://www.w3.org/1999/xlink"--}}
            {{--                        width="24px"--}}
            {{--                        height="24px"--}}
            {{--                        viewBox="0 0 48.824 48.824"--}}
            {{--                        xml:space="preserve"--}}
            {{--                    >--}}
            {{--              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>--}}
            {{--                        <g--}}
            {{--                            id="SVGRepo_tracerCarrier"--}}
            {{--                            stroke-linecap="round"--}}
            {{--                            stroke-linejoin="round"--}}
            {{--                        ></g>--}}
            {{--                        <g id="SVGRepo_iconCarrier">--}}
            {{--                            <g>--}}
            {{--                                <g>--}}
            {{--                                    <g>--}}
            {{--                                        <path--}}
            {{--                                            d="M28.043,32.874c-0.238,0-0.475-0.085-0.66-0.249l-4.623-4.07h-5.051c-0.552,0-1-0.449-1-1v-7.2c0-0.552,0.448-1,1-1 h4.688l5.078-3.508c0.305-0.211,0.702-0.234,1.032-0.062c0.329,0.173,0.535,0.514,0.535,0.886v15.203 c0,0.394-0.229,0.749-0.588,0.911C28.322,32.846,28.182,32.874,28.043,32.874z M18.709,26.553h4.428 c0.243,0,0.479,0.09,0.66,0.25l3.246,2.857V18.577l-3.766,2.602c-0.166,0.115-0.365,0.177-0.568,0.177h-4V26.553z"--}}
            {{--                                        ></path>--}}
            {{--                                    </g>--}}
            {{--                                    <g>--}}
            {{--                                        <path--}}
            {{--                                            d="M24.412,48.824C10.951,48.824,0,37.873,0,24.412S10.951,0,24.412,0s24.412,10.951,24.412,24.412 S37.873,48.824,24.412,48.824z M24.412,2C12.055,2,2,12.055,2,24.412C2,36.77,12.055,46.824,24.412,46.824 c12.357,0,22.412-10.055,22.412-22.412C46.824,12.054,36.77,2,24.412,2z"--}}
            {{--                                        ></path>--}}
            {{--                                    </g>--}}
            {{--                                </g>--}}
            {{--                            </g>--}}
            {{--                        </g>--}}
            {{--            </svg>--}}
            {{--                </button>--}}
            {{--            </div>--}}
            <div style="display: flex;justify-content: center;align-items: center;gap: 8px;">
                <span id="student_coins" style="font-size: 25px;">{{ auth()->user()->games_coins }}</span>
                <img style="width: 25px;" src="{{ asset('assets/icons/coin.png') }}">
            </div>
        </div>
    </header>
    <main>
        <div class="container">
            <div class="Questions" id="question_data">
                @if (count($game->questions) > 0)
                    <div class="question">
                        <div class="questionNumber"><span
                                id="question_num">1</span>/<span>{{ count($game->questions) }}</span></div>
                        <div class="questionRow">
                            @if($game->questions[0]->voice_url)
                                <button class="musicBtnQuestion"
                                        onclick="question_voice('{{ $game->questions[0]->voice_url }}')">
                                    <img src="{{ asset('assets/icons/mic.svg') }}" alt="" width="40px"/>
                                </button>
                            @endif
                            @if($game->questions[0]->question)
                                <h1>{{ $game->questions[0]->question }}</h1>
                            @endif
                            @if($game->questions[0]->image)
                                <div class="imgQuestion">
                                    <img
                                        src="{{ $game->questions[0]->image }}"
                                        alt="question-1"
                                        class="questionImg"
                                    />
                                </div>
                            @endif
                        </div>
                    </div>
                    <div class="answers">
                        <input id="question_index" hidden value="0">
                        <input id="question_id" hidden value="{{ $game->questions[0]->id }}">
                        <input id="correct_answer" hidden value="{{ $game->questions[0]->correct_answer }}">
                        <div class="answerCard" id="answerCard1"
                             onclick="answer_hacking_question('{{ $game->questions[0]->answer1 }}', 1)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer1 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer1 }}" alt="">
                            @endif
                        </div>
                        <div class="answerCard" id="answerCard2"
                             onclick="answer_hacking_question('{{ $game->questions[0]->answer2 }}', 2)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer2 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer2 }}" alt="">
                            @endif
                        </div>
                        <div class="answerCard" id="answerCard3"
                             onclick="answer_hacking_question('{{ $game->questions[0]->answer3 }}', 3)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer3 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer3 }}" alt="">
                            @endif
                        </div>
                        <div class="answerCard" id="answerCard4"
                             onclick="answer_hacking_question('{{ $game->questions[0]->answer4 }}', 4)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer4 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer4 }}" alt="">
                            @endif
                        </div>
                    </div>
                    <div id="show_correct_answer">
                    </div>
                @endif
                {{--                <div class="question">--}}
                {{--                    <div class="questionNumber"><span id="question_num">1</span>/<span>{{ count($game->questions) }}</span></div>--}}
                {{--                    <h1>Who is that animal</h1>--}}
                {{--                    <img--}}
                {{--                        src="{{ asset('assets/images/testQuestion.png') }}"--}}
                {{--                        alt="question-1"--}}
                {{--                        class="questionImg"--}}
                {{--                    />--}}
                {{--                </div>--}}
                {{--                <div class="answers">--}}
                {{--                    <div class="answerCard">Dog</div>--}}
                {{--                    <div class="answerCard">monkey</div>--}}
                {{--                    <div class="answerCard">Owl</div>--}}
                {{--                    <div class="answerCard">Rat</div>--}}
                {{--                </div>--}}
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.10.2/lottie.min.js"></script>
    <script>
        let questions = JSON.parse('<?php echo $game->questions; ?>')
    </script>
    <script src="{{ asset('js/student/main.js') }}"></script>
    <script src="{{ asset('js/student/hack.js') }}"></script>
    <script>
        // localStorage.setItem("current_question", 52)
        console.log('dsds ' + localStorage.getItem("countdownEndTime"))
        // console.log(parseInt(question_num) === questions.length)
        if (localStorage.getItem("current_question") && (parseInt(localStorage.getItem("current_question")) + 1) !== questions.length) {
            let question_num = parseInt(localStorage.getItem("current_question")) + 1
            $('#question_data').empty()
            // questions[parseInt(question_num.innerText)]
            let question_image = ''
            let question_voice_url = ''
            let question_text = ''
            let question1 = ''
            let question2 = ''
            let question3 = ''
            let question4 = ''
            if (questions[parseInt(question_num)].image) {
                question_image = `
                            <div class="imgQuestion">
                                <img
                                src="${questions[parseInt(question_num)].image}"
                                alt="question-1"
                                class="questionImg"/>
                            </div>`
            }
            if (questions[parseInt(question_num)].voice_url) {
                question_voice_url = `
                            <button class="musicBtnQuestion" onclick="question_voice('${questions[parseInt(question_num)].voice_url}')">
                                <img src="/assets/icons/mic.svg" alt="" width="40px"/>
                            </button>`
            }
            if (questions[parseInt(question_num)].question) {
                question_text = `<h1>${questions[parseInt(question_num)].question}</h1>`
            }
            if (questions[parseInt(question_num)].answer_type === 'text') {
                question1 = questions[parseInt(question_num)].answer1
                question2 = questions[parseInt(question_num)].answer2
                question3 = questions[parseInt(question_num)].answer3
                question4 = questions[parseInt(question_num)].answer4
            } else if (questions[parseInt(question_num)].answer_type === 'image') {
                question1 = `<img src="${questions[parseInt(question_num)].answer1}" alt="">`
                question2 = `<img src="${questions[parseInt(question_num)].answer2}" alt="">`
                question3 = `<img src="${questions[parseInt(question_num)].answer3}" alt="">`
                question4 = `<img src="${questions[parseInt(question_num)].answer4}" alt="">`
            }

            $('#question_data').append(`
                    <div class="question">
                        <div class="questionNumber"><span id="question_num">${parseInt(question_num) + 1}</span>/<span>${questions.length}</span></div>
                        <div class="questionRow">
                            ${question_voice_url}
                            ${question_text}
                            ${question_image}
                        </div>
                    </div>
                    <div class="answers">
                        <input id="question_index" hidden value="${parseInt(question_num)}">
                        <input id="question_id" hidden value="${questions[parseInt(question_num)].id}">
                        <input id="correct_answer" hidden value="${questions[parseInt(question_num)].correct_answer}">
                        <div class="answerCard" id="answerCard1" onclick="answer_hacking_question('${questions[parseInt(question_num)].answer1}', 1)">${question1}</div>
                        <div class="answerCard" id="answerCard2" onclick="answer_hacking_question('${questions[parseInt(question_num)].answer2}', 2)">${question2}</div>
                        <div class="answerCard" id="answerCard3" onclick="answer_hacking_question('${questions[parseInt(question_num)].answer3}', 3)">${question3}</div>
                        <div class="answerCard" id="answerCard4" onclick="answer_hacking_question('${questions[parseInt(question_num)].answer4}', 4)">${question4}</div>
                    </div>
                    <div id="show_correct_answer">
                    </div>
                `)
            document.getElementById('question_num').innerText = parseInt(question_num) + 1
        }  else if ((parseInt(localStorage.getItem("current_question")) + 1) === questions.length) {
            window.location.href = '/student/facts/'+game_id;
        }
        // localStorage.removeItem("current_question");
    </script>
@endsection
