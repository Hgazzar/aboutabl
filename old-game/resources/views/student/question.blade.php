@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/student/style.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/styleNew.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/normalize.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/student/all.min.css') }}"/>
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
                             onclick="answer_question('{{ $game->questions[0]->answer1 }}', 1)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer1 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer1 }}" alt="">
                            @endif
                        </div>
                        <div class="answerCard" id="answerCard2"
                             onclick="answer_question('{{ $game->questions[0]->answer2 }}', 2)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer2 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer2 }}" alt="">
                            @endif
                        </div>
                        <div class="answerCard" id="answerCard3"
                             onclick="answer_question('{{ $game->questions[0]->answer3 }}', 3)">
                            @if($game->questions[0]->answer_type == 'text')
                                {{ $game->questions[0]->answer3 }}
                            @elseif($game->questions[0]->answer_type == 'image')
                                <img src="{{ $game->questions[0]->answer3 }}" alt="">
                            @endif
                        </div>
                        <div class="answerCard" id="answerCard4"
                             onclick="answer_question('{{ $game->questions[0]->answer4 }}', 4)">
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
    @if($game->type == 'hacking')
        <script src="{{ asset('js/student/hack.js') }}"></script>
    @endif
    <script>
        {{--let questions = JSON.parse('<?php echo $game->questions; ?>')--}}
        // console.log(questions[0])
        // console.log(questions[1]);
        // الحصول على جميع عناصر الإجابات
        {{--const answerCards = document.querySelectorAll(".answerCard");--}}

        {{--// إضافة حدث النقر--}}
        {{--answerCards.forEach((card) => {--}}
        {{--    card.addEventListener("click", () => {--}}
        {{--        let correct_answer = document.getElementById('correct_answer').value--}}
        {{--        let question_id = document.getElementById('question_id').value--}}
        {{--        let question_index = document.getElementById('question_index').value--}}
        {{--        let question_num = document.getElementById('question_num')--}}
        {{--        console.log(question_index)--}}
        {{--        console.log(question_num.innerText)--}}
        {{--        // return false--}}
        {{--        $.ajax({--}}
        {{--            headers: {--}}
        {{--                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')--}}
        {{--            },--}}
        {{--            url : "{{ route('answer.question') }}",--}}
        {{--            data : {--}}
        {{--                'question_id' : question_id,--}}
        {{--                'answer': card.textContent,--}}
        {{--                'correct' : card.textContent === correct_answer--}}
        {{--            },--}}
        {{--            type : 'POST',--}}
        {{--            dataType : 'json',--}}
        {{--            success : function(result){--}}

        {{--                // console.log("===== " + parseInt(question_num.innerText) === questions.length + " =====");--}}
        {{--                // return false--}}
        {{--                if (parseInt(question_num.innerText) != questions.length) {--}}
        {{--                    // console.log("===== " + result.error + " =====");--}}

        {{--                    if (card.textContent === correct_answer) {--}}
        {{--                        // question_num.innerText += parseInt(question_num.innerText)--}}
        {{--                        // إزالة جميع الأنيميشن القديم من الإجابات الأخرى--}}
        {{--                        answerCards.forEach((otherCard) => {--}}
        {{--                            otherCard.innerHTML = otherCard.textContent.trim(); // إعادة النص الأصلي--}}
        {{--                        });--}}

        {{--                        // إضافة فئة successAnswer--}}
        {{--                        card.classList.add("successAnswer");--}}

        {{--                        // إضافة عنصر للأنيميشن داخل div--}}
        {{--                        const animationContainer = document.createElement("div");--}}
        {{--                        animationContainer.id = "lottieAnimation";--}}
        {{--                        animationContainer.style.width = "150px";--}}
        {{--                        animationContainer.style.height = "150px";--}}
        {{--                        animationContainer.style.marginTop = "10px";--}}
        {{--                        animationContainer.style.position = "absolute";--}}
        {{--                        animationContainer.style.top = "50%";--}}
        {{--                        animationContainer.style.left = "50%";--}}
        {{--                        animationContainer.style.transform = "translate(-50%,-50%)";--}}

        {{--                        card.appendChild(animationContainer);--}}

        {{--                        // تحميل الأنيميشن باستخدام Lottie--}}
        {{--                        lottie.loadAnimation({--}}
        {{--                            container: animationContainer, // العنصر الذي ستضاف إليه الأنيميشن--}}
        {{--                            renderer: "svg",--}}
        {{--                            loop: true,--}}
        {{--                            autoplay: true,--}}
        {{--                            // path: "https://lottiefiles.com/animations/confetti-wPurEHD768",--}}
        {{--                            path: "https://assets8.lottiefiles.com/packages/lf20_touohxv0.json", // رابط ملف الأنيميشن JSON--}}
        {{--                        });--}}
        {{--                    } else {--}}
        {{--                        // إضافة wrongAnswer--}}
        {{--                        card.classList.add("wrongAnswer");--}}
        {{--                    }--}}
        {{--                    // التأكد من إزالة "wrongAnswer" أو "successAnswer" من البقية--}}
        {{--                    answerCards.forEach((otherCard) => {--}}
        {{--                        if (otherCard !== card) {--}}
        {{--                            otherCard.classList.remove("successAnswer", "wrongAnswer");--}}
        {{--                        }--}}
        {{--                    });--}}
        {{--                    setTimeout(function() {--}}
        {{--                        //your code to be executed after 1 second--}}
        {{--                    }, 3000);--}}
        {{--                    $('#question_data').empty()--}}
        {{--                    // questions[parseInt(question_num.innerText)]--}}
        {{--                    let question_image = ''--}}
        {{--                    if (questions[parseInt(question_num.innerText)].image) {--}}
        {{--                        question_image = `--}}
        {{--                            <img--}}
        {{--                            src="${questions[parseInt(question_num.innerText)].image}"--}}
        {{--                            alt="question-1"--}}
        {{--                            class="questionImg"--}}
        {{--                        />`--}}
        {{--                    }--}}
        {{--                    $('#question_data').append(`--}}
        {{--                        <div class="question">--}}
        {{--                            <div class="questionNumber"><span id="question_num">${parseInt(question_num.innerText) + 1}</span>/<span>${questions.length}</span></div>--}}
        {{--                            <h1>${questions[parseInt(question_num.innerText)].question}</h1>--}}
        {{--                            ${question_image}--}}
        {{--                        </div>--}}
        {{--                        <div class="answers">--}}
        {{--                            <input id="question_index" hidden value="${parseInt(question_num.innerText)}">--}}
        {{--                            <input id="question_id" hidden value="${questions[parseInt(question_num.innerText)].id}">--}}
        {{--                            <input id="correct_answer" hidden value="${questions[parseInt(question_num.innerText)].correct_answer}">--}}
        {{--                            <div class="answerCard">${questions[parseInt(question_num.innerText)].answer1}</div>--}}
        {{--                            <div class="answerCard">${questions[parseInt(question_num.innerText)].answer2}</div>--}}
        {{--                            <div class="answerCard">${questions[parseInt(question_num.innerText)].answer3}</div>--}}
        {{--                            <div class="answerCard">${questions[parseInt(question_num.innerText)].answer4}</div>--}}
        {{--                        </div>--}}
        {{--                    `)--}}
        {{--                    question_num.innerText = parseInt(question_num.innerText) + 1--}}

        {{--                } else {--}}

        {{--                }--}}

        {{--            }--}}
        {{--        });--}}
        {{--        // التحقق من الإجابة الصحيحة    card.textContent.trim().toLowerCase()--}}
        {{--        // if (card.textContent === correct_answer) {--}}
        {{--        //     // إزالة جميع الأنيميشن القديم من الإجابات الأخرى--}}
        {{--        //     answerCards.forEach((otherCard) => {--}}
        {{--        //         otherCard.innerHTML = otherCard.textContent.trim(); // إعادة النص الأصلي--}}
        {{--        //     });--}}
        {{--        //--}}
        {{--        //     // إضافة فئة successAnswer--}}
        {{--        //     card.classList.add("successAnswer");--}}
        {{--        //--}}
        {{--        //     // إضافة عنصر للأنيميشن داخل div--}}
        {{--        //     const animationContainer = document.createElement("div");--}}
        {{--        //     animationContainer.id = "lottieAnimation";--}}
        {{--        //     animationContainer.style.width = "150px";--}}
        {{--        //     animationContainer.style.height = "150px";--}}
        {{--        //     animationContainer.style.marginTop = "10px";--}}
        {{--        //     animationContainer.style.position = "absolute";--}}
        {{--        //     animationContainer.style.top = "50%";--}}
        {{--        //     animationContainer.style.left = "50%";--}}
        {{--        //     animationContainer.style.transform = "translate(-50%,-50%)";--}}
        {{--        //--}}
        {{--        //     card.appendChild(animationContainer);--}}
        {{--        //--}}
        {{--        //     // تحميل الأنيميشن باستخدام Lottie--}}
        {{--        //     lottie.loadAnimation({--}}
        {{--        //         container: animationContainer, // العنصر الذي ستضاف إليه الأنيميشن--}}
        {{--        //         renderer: "svg",--}}
        {{--        //         loop: true,--}}
        {{--        //         autoplay: true,--}}
        {{--        //         // path: "https://lottiefiles.com/animations/confetti-wPurEHD768",--}}
        {{--        //         path: "https://assets8.lottiefiles.com/packages/lf20_touohxv0.json", // رابط ملف الأنيميشن JSON--}}
        {{--        //     });--}}
        {{--        // } else {--}}
        {{--        //     // إضافة wrongAnswer--}}
        {{--        //     card.classList.add("wrongAnswer");--}}
        {{--        // }--}}
        {{--        //--}}
        {{--        // // التأكد من إزالة "wrongAnswer" أو "successAnswer" من البقية--}}
        {{--        // answerCards.forEach((otherCard) => {--}}
        {{--        //     if (otherCard !== card) {--}}
        {{--        //         otherCard.classList.remove("successAnswer", "wrongAnswer");--}}
        {{--        //     }--}}
        {{--        // });--}}
        {{--    });--}}
        {{--});--}}
    </script>
@endsection
