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
                <img src="/{{ $game->logo }}" alt="logo" />
                <span>{{ $game->name }}</span>
            </div>
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
            </button>
        </div>
    </header>
    <main>
        <div class="container">
            <div class="answerList" style="max-width: 1000px;">
                <h1 style="color: #383838;">Student Name: {{ $student_answers[0]->student->name }}</h1>
                <table style="padding: 30px 0 0 30px;border-radius: 8.072px;background: rgba(255, 255, 255, 0.10);backdrop-filter: blur(23px);width: 100%;">
                    <tbody>
                    @foreach($student_answers as $index=>$question)
                        <tr style="color: #383838;font-size: 17.9px;font-style: normal;font-weight: 600;line-height: normal;text-transform: uppercase;">
                            <td>{{ $index+1 }}. {{ $question->question_game->question }}</td>
                            <td class="personData">
                                @if($question->question_game->answer_type == 'text')
                                    (Student answer: {{ $question->answer }})
                                @elseif($question->question_game->answer_type == 'image')
                                    (Student answer: <img src="{{ $question->answer }}" style="height: 75px;" alt="">)
                                @endif
                            </td>
                            <td class="personScore">
                                @if($question->correct == 1)
                                    <img src="{{ asset('assets/icons/correct.svg') }}" alt="correct" class="correct" />
                                @else
                                    <img src="{{ asset('assets/icons/wrong.svg') }}" alt="wrong" class="wrong" />
                                @endif
                            </td>
                        </tr>
                    @endforeach

                    </tbody>
                </table>
                {{--<ul>
                    @foreach($student_answers as $index=>$question)
                        <li>
                            <span>{{ $index+1 }}. {{ $question->question_game->question }}</span>
                            <span>(Student answer: {{ $question->answer }})</span>
                            @if($question->correct == 1)
                                <img src="{{ asset('assets/icons/correct.svg') }}" alt="correct" class="correct" />
                            @else
                                <img src="{{ asset('assets/icons/wrong.svg') }}" alt="wrong" class="wrong" />
                            @endif

                        </li>
                    @endforeach
                </ul>--}}
            </div>
        </div>
    </main>
@endsection
@section('scripts')
    <script src="{{ asset('js/student/main.js') }}"></script>
@endsection


