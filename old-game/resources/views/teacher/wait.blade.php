@extends('layouts.teacher')
@section('style')
    <link rel="stylesheet" href="{{ asset('css/teacher/style.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/normalize.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/teacher/all.min.css') }}"/>
    @if($game && $game->type == 'hacking')
        <link rel="stylesheet" href="{{ asset('css/student/hack.css') }}"/>
    @endif
    @if($game && $game->type == 'gold_quest')
        <link rel="stylesheet" href="{{ asset('css/student/gold_quest.css') }}"/>
    @endif
@endsection
@section('content')
    <input id="game_id" value="{{ $game_id }}" hidden>
    <input id="game_question_count" value="{{ $game ? count($game->questions) : 0 }}" hidden>
    <header class="header headerWait">
        <div class="container">
            <div class="logo">
                @if($game && $game->logo)
                    <img src="/{{ $game->logo }}" alt="logo"/>
                @endif
                <span>{{ $game->name ?? 'Game' }}</span>
            </div>
            <div class="contentHeader startButton">
                <div class="beforeLine">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="44"
                        height="78"
                        viewBox="0 0 44 78"
                        fill="none"
                    >
                        <path d="M0 0H3L43.5 78H40.5L0 0Z" fill="#D9D9D9"/>
                    </svg>
                </div>
                <input id="game_id" value="{{ $game_id }}" hidden>
                <a href="/teacher/statistics-list/{{$game_id}}">START</a>
                <div class="afterLine">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="44"
                        height="78"
                        viewBox="0 0 44 78"
                        fill="none"
                    >
                        <path d="M44 0H41L0 78H3L44 0Z" fill="#D9D9D9"/>
                    </svg>
                </div>
            </div>

            <div>
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
{{--            <button class="endBtn">END</button>--}}
        </div>
    </header>
    <main>
        <div class="container">
{{--            <div class="mainWaiting">--}}
{{--                <div class="joinBox">--}}
{{--                    <div class="roomLink">--}}
{{--                        <span>Room link</span>--}}
{{--                        <input type="text" value="join my game.com" disabled/>--}}
{{--                        <button class="copyBtn">--}}
{{--                            <svg--}}
{{--                                xmlns="http://www.w3.org/2000/svg"--}}
{{--                                width="13"--}}
{{--                                height="13"--}}
{{--                                viewBox="0 0 13 13"--}}
{{--                                fill="none"--}}
{{--                            >--}}
{{--                                <path--}}
{{--                                    d="M11.375 0H3.94643C3.06429 0 2.32143 0.742857 2.32143 1.625V2.32143H1.85714C0.835714 2.32143 0 3.15714 0 4.17857V11.1429C0 12.1643 0.835714 13 1.85714 13H8.82143C9.84286 13 10.6786 12.1643 10.6786 11.1429V10.6786H11.375C12.2571 10.6786 13 9.93571 13 9.05357V1.625C13 0.742857 12.2571 0 11.375 0ZM9.75 11.1429C9.75 11.6536 9.33214 12.0714 8.82143 12.0714H1.85714C1.34643 12.0714 0.928571 11.6536 0.928571 11.1429V4.17857C0.928571 3.66786 1.34643 3.25 1.85714 3.25H8.82143C9.33214 3.25 9.75 3.66786 9.75 4.17857V11.1429ZM12.0714 9.05357C12.0714 9.425 11.7464 9.75 11.375 9.75H10.6786V4.17857C10.6786 3.15714 9.84286 2.32143 8.82143 2.32143H3.25V1.625C3.25 1.25357 3.575 0.928571 3.94643 0.928571H11.375C11.7464 0.928571 12.0714 1.25357 12.0714 1.625V9.05357Z"--}}
{{--                                    fill="white"--}}
{{--                                />--}}
{{--                            </svg>--}}
{{--                        </button>--}}
{{--                    </div>--}}
{{--                    <div class="roomCode">--}}
{{--                        <span>Room Code</span>--}}
{{--                        <!-- <h3>249956</h3> -->--}}
{{--                        <input type="text" value="249956" disabled/>--}}

{{--                        <button class="copyBtn">--}}
{{--                            <svg--}}
{{--                                xmlns="http://www.w3.org/2000/svg"--}}
{{--                                width="13"--}}
{{--                                height="13"--}}
{{--                                viewBox="0 0 13 13"--}}
{{--                                fill="none"--}}
{{--                            >--}}
{{--                                <path--}}
{{--                                    d="M11.375 0H3.94643C3.06429 0 2.32143 0.742857 2.32143 1.625V2.32143H1.85714C0.835714 2.32143 0 3.15714 0 4.17857V11.1429C0 12.1643 0.835714 13 1.85714 13H8.82143C9.84286 13 10.6786 12.1643 10.6786 11.1429V10.6786H11.375C12.2571 10.6786 13 9.93571 13 9.05357V1.625C13 0.742857 12.2571 0 11.375 0ZM9.75 11.1429C9.75 11.6536 9.33214 12.0714 8.82143 12.0714H1.85714C1.34643 12.0714 0.928571 11.6536 0.928571 11.1429V4.17857C0.928571 3.66786 1.34643 3.25 1.85714 3.25H8.82143C9.33214 3.25 9.75 3.66786 9.75 4.17857V11.1429ZM12.0714 9.05357C12.0714 9.425 11.7464 9.75 11.375 9.75H10.6786V4.17857C10.6786 3.15714 9.84286 2.32143 8.82143 2.32143H3.25V1.625C3.25 1.25357 3.575 0.928571 3.94643 0.928571H11.375C11.7464 0.928571 12.0714 1.25357 12.0714 1.625V9.05357Z"--}}
{{--                                    fill="white"--}}
{{--                                />--}}
{{--                            </svg>--}}
{{--                        </button>--}}
{{--                    </div>--}}
{{--                </div>--}}
{{--                <!-- <div class="shareBox"></div> -->--}}
{{--            </div>--}}
            <!-- <div class="timeBox"></div> -->
            <div class="waitTitle">
                <img src="{{ asset('assets/icons/people.svg') }}" alt="group-icon"/>
                <h4>Waiting for practicipants...</h4>
            </div>
            <div class="waitTitle">
                <img src="{{ asset('assets/icons/people.svg') }}" alt="group-icon"/>
                <h4>( <span id="students_count"></span> ) practicipants...</h4>
            </div>
            <div class="studentNameCardList" id="students_wait_list">
{{--                <div class="studentNameCard">--}}
{{--                    <img src="{{ asset('assets/icons/person.svg') }}" alt="person-icon" class="person-icon"/>--}}
{{--                    <h5>student name</h5>--}}
{{--                </div>--}}
{{--                <div class="studentNameCard">--}}
{{--                    <img src="{{ asset('public/assets/icons/person.svg') }}" alt="person-icon" class="person-icon"/>--}}
{{--                    <h5>student name</h5>--}}
{{--                </div>--}}
{{--                <div class="studentNameCard">--}}
{{--                    <img src="{{ asset('assets/icons/person.svg') }}" alt="person-icon" class="person-icon"/>--}}
{{--                    <h5>student name</h5>--}}
{{--                </div>--}}
{{--                <div class="studentNameCard">--}}
{{--                    <img src="{{ asset('assets/icons/person.svg') }}" alt="person-icon" class="person-icon"/>--}}
{{--                    <h5>student name</h5>--}}
{{--                </div>--}}
{{--            </div>--}}
        </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/teacher/main.js') }}"></script>
@endsection
