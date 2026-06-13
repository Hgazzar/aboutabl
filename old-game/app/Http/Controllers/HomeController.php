<?php

namespace App\Http\Controllers;

use App\Models\Game1;
use App\Models\StudentAnswerGame;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Broadcasting\InteractsWithSockets;

class HomeController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:web,teacher');
    }

    public function index()
    {
        $user = auth()->guard('web')->user();
        $games = Game1::with(['questions'])->latest()->get();
//        broadcast(new \App\Events\UserStatusChanged($user, true));
        return view('home', compact('games'));
    }

    public function teacher_index($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        return view('teacher.index', compact('game_id', 'game'));
    }
    public function teacher_waiting($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        if (!$game) {
            return redirect('/teacher/games/index')->with('error', 'Game not found.');
        }
        return view('teacher.wait', compact('game_id', 'game'));
    }
    public function teacher_statistics_list($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        Log::info('About to fire UserJoinedPresenceChannel event.');
        broadcast(new \App\Events\UserStatusChanged(auth()->guard('teacher')->user(), true, $game_id))->toOthers();
        Log::info('UserJoinedPresenceChannel event has been fired.');
//        return true;
        return view('teacher.statisticsList', compact('game_id', 'game'));
    }
    public function teacher_facts($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();

        $students_answer = StudentAnswerGame::with(['question_game', 'question_game.game', 'question_game.game.questions', 'student', 'student.questions_answer' => function($q) {
            $q->whereDate('created_at', date('Y-m-d'));
        }])
            ->whereDate('created_at', date('Y-m-d'))
            ->whereHas('question_game', function($q) use($game_id) {
                $q->where('game1_id', $game_id);
            })
            ->select( 'student_id', 'game_question_id', DB::raw('SUM(correct) as total_answer'))
            ->groupBy('student_id')
            ->orderBy('total_answer', 'desc')
//            ->take(3)
            ->get();
        broadcast(new \App\Events\UserStatusChanged(auth()->guard('teacher')->user(), false, $game_id))->toOthers();
//        dd($students_answer);
        return view('teacher.facts', compact('game_id', 'game', 'students_answer'));
    }

    public function student_answerList($student_id, $game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        $student_answers = StudentAnswerGame::with(['question_game', 'question_game.game', 'question_game.game.questions', 'student', 'student.questions_answer' => function($q) {
            $q->whereDate('created_at', date('Y-m-d'));
        }])
            ->whereDate('created_at', date('Y-m-d'))
            ->whereHas('question_game', function($q) use($game_id) {
                $q->where('game1_id', $game_id);
            })
            ->where('student_id', $student_id)
            ->get();
//        dd($student_answers);
        return view('teacher.answerDetails', compact('game_id', 'game', 'student_answers'));
    }
}
