@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/teacher/style.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/normalize.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/all.min.css') }}"/>
    @if($game->type == 'hacking')
        <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}"/>
    @endif
    @if($game->type == 'gold_quest')
{{--        <link rel="stylesheet" href="{{ asset('css/student/gold_quest.css') }}"/>--}}
        <style>
            body {
                background-image: url('../../assets/images/gold-bg.jpg');
                background-color: #0f1a2c; /* Fallback color if image fails to load */
                font-family: "Raleway", sans-serif; /* Changed serif to sans-serif (common for Raleway) */
                margin: 0; /* Remove default body margin */
                overflow-x: auto; /* Prevent horizontal scrolling */
                background-position: center center;
                background-repeat: no-repeat; /* Uncommented to prevent image tiling */
                background-size: cover; /* Better than 100% 100% (prevents stretching) */
                background-attachment: fixed; /* Optional: Keep background fixed during scrolling */
                min-height: 100vh;
            }
            .studentDegree {
                background: rgba(217, 217, 217, 79%);
            }
        </style>
    @endif

@endsection
@section('content')
    <header class="header headerWait header-facts">
        <div class="container">
            <input id="game_id" value="{{ $game_id }}" hidden>
            <input id="game_question_count" value="{{ count($game->questions) }}" hidden>
            <div class="logo">
                <img src="/{{ $game->logo }}" alt="logo"/>
                <span>{{ $game->name }}</span>
            </div>
            <div class="contentHeader titleFactHeader">END RESULT</div>
            <!-- <button class="endBtn">END</button> -->
            <button class="musicBtn">
                <svg
                    fill="#fff"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    width="24px"
                    height="24px"
                    viewBox="0 0 48.824 48.824"
                    xml:space="preserve"
                >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                        <g>
                            <g>
                                <g>
                                    <path
                                        d="M28.043,32.874c-0.238,0-0.475-0.085-0.66-0.249l-4.623-4.07h-5.051c-0.552,0-1-0.449-1-1v-7.2c0-0.552,0.448-1,1-1 h4.688l5.078-3.508c0.305-0.211,0.702-0.234,1.032-0.062c0.329,0.173,0.535,0.514,0.535,0.886v15.203 c0,0.394-0.229,0.749-0.588,0.911C28.322,32.846,28.182,32.874,28.043,32.874z M18.709,26.553h4.428 c0.243,0,0.479,0.09,0.66,0.25l3.246,2.857V18.577l-3.766,2.602c-0.166,0.115-0.365,0.177-0.568,0.177h-4V26.553z"
                                    ></path>
                                </g>
                                <g>
                                    <path
                                        d="M24.412,48.824C10.951,48.824,0,37.873,0,24.412S10.951,0,24.412,0s24.412,10.951,24.412,24.412 S37.873,48.824,24.412,48.824z M24.412,2C12.055,2,2,12.055,2,24.412C2,36.77,12.055,46.824,24.412,46.824 c12.357,0,22.412-10.055,22.412-22.412C46.824,12.054,36.77,2,24.412,2z"
                                    ></path>
                                </g>
                            </g>
                        </g>
                    </g>
          </svg>
                <!-- <i class="fas fa-music"></i> -->
                <!-- أيقونة الموسيقى -->
            </button>
        </div>
    </header>
    <main class="mainDegrees">
        <div class="container">
            <div class="mainFacts">
                <div class="studentsRateList">
                    @if(isset($students_answer[1]))
                        <div class="studentRatecard nd">
                            <div class="studentInfo">
                                <img
                                    src="{{ asset('assets/icons/person.svg') }}"
                                    alt="student-img"
                                    class="person-facts-icon"
                                />
                                <h2>
                                    <a href="/teacher/student_detail/{{ $students_answer[1]->student->id }}/{{ $game->id }}" style="color: #FFF;text-decoration: none;">
                                        {{ $students_answer[1]->student->name }}
                                    </a>
                                </h2>
                            </div>
                            @php
                                $correct_answers2 = 0;
                                foreach ($students_answer[1]->student->questions_answer as $item) {
                                    if ($item->correct == 1) {
                                        $correct_answers2++;
                                    }
                                }
                            @endphp
                            <div class="studentDegree">
                                <h3>2nd</h3>
                                <div class="Accuracy">
                                    <span>Accuracy</span>
                                    <span><span>{{ $students_answer[1]->total_answer }}</span>/<span>{{ count($game->questions) }}</span></span>
                                </div>
                            </div>
                        </div>
                    @endif
                    @if(isset($students_answer[0]))
                        <div class="studentRatecard st">
                            <div class="studentInfo">

                                <div class="stTag">
                                    <img src="{{ asset('assets/images/king.gif') }}" alt=""/>
                                </div>

                                <img
                                    src="{{ asset('assets/icons/person.svg') }}"
                                    alt="student-img"
                                    class="person-facts-icon"
                                />
                                <h2>
                                    <a href="/teacher/student_detail/{{ $students_answer[0]->student->id }}/{{ $game->id }}" style="color: #FFF;text-decoration: none;">
                                    {{ $students_answer[0]->student->name }}
                                    </a>
                                </h2>
                            </div>
                            @php
                                $correct_answers1 = 0;
                                foreach ($students_answer[0]->student->questions_answer as $item) {
                                    if ($item->correct == 1) {
                                        $correct_answers1++;
                                    }
                                }
                            @endphp
                            <div class="studentDegree">
                                <h3>1st</h3>
                                <div class="Accuracy">
                                    <span>Accuracy</span>
                                    <span><span>{{ $students_answer[0]->total_answer }}</span>/<span>{{ count($game->questions) }}</span></span>
                                </div>
                            </div>
                        </div>
                    @endif
                    @if(isset($students_answer[2]))
                        <div class="studentRatecard rd">
                            <div class="studentInfo">
                                <img
                                    src="{{ asset('assets/icons/person.svg') }}"
                                    alt="student-img"
                                    class="person-facts-icon"
                                />
                                <h2>
                                    <a href="/teacher/student_detail/{{ $students_answer[2]->student->id }}/{{ $game->id }}" style="color: #FFF;text-decoration: none;">
                                        {{ $students_answer[2]->student->name }}
                                    </a>
                                </h2>
                            </div>
                            @php
                                $correct_answers3 = 0;
                                foreach ($students_answer[2]->student->questions_answer as $item) {
                                    if ($item->correct == 1) {
                                        $correct_answers3++;
                                    }
                                }
                            @endphp
                            <div class="studentDegree">
                                <h3>3rd</h3>
                                <div class="Accuracy">
                                    <span>Accuracy</span>
                                    <span><span>{{ $students_answer[2]->total_answer }}</span>/<span>{{ count($game->questions) }}</span></span>
                                </div>
                            </div>
                        </div>
                    @endif

                </div>
                <div class="ListStudents" style="padding: 30px 165px;">
                    <table style="padding: 30px;border-radius: 8.072px;background: rgba(255, 255, 255, 0.10);backdrop-filter: blur(23px);">
                        <thead>
                        <tr>
                            <td>Rank</td>
                            <td>Name</td>
                            <td>Score</td>
                        </tr>
                        </thead>
                        <tbody>
                        @foreach($students_answer as $index=>$student)
                            @if($index > 2)
                                <tr>
                                    <td>{{ $student->student->id }}</td>
                                    <td class="personData">
                                        <img
                                            src="{{ asset('assets/icons/person.svg') }}"
                                            alt="person-icon"
                                            class="person-icon"
                                        />
                                        <a href="/teacher/student_detail/{{ $student->student->id }}/{{ $game->id }}" style="color: #FFF;text-decoration: none;">
                                            <span>{{ $student->student->name }}</span>
                                        </a>
                                    </td>
                                    @php
                                        $correct_answers = 0;
                                        foreach ($student->student->questions_answer as $item) {
                                            if ($item->correct == 1) {
                                                $correct_answers++;
                                            }
                                        }
                                    @endphp
                                    <td class="personScore"><span>{{ $student->total_answer }}</span>/<span>{{ count($game->questions) }}</span></td>
                                </tr>
                            @endif
                        @endforeach

                        </tbody>
                    </table>
                </div>
                <!-- <div class="shareBox"></div> -->
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/teacher/main.js') }}"></script>
@endsection
