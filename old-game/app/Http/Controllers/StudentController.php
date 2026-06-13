<?php

namespace App\Http\Controllers;

use App\Models\Game1;
use App\Models\Student;
use App\Models\StudentAnswerGame;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:student');
    }

    public function index()
    {
        $user = auth()->guard('web')->user();
        $games = Game1::with(['questions'])->latest()->get();
//        broadcast(new \App\Events\UserStatusChanged($user, true));
        return view('home', compact('games'));
    }

    public function student_index($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        $user = auth()->guard('student')->user();
//        broadcast(new \App\Events\UserStatusChanged($user, true, $game_id));
//        if ($game->type == 'classic') {
        return view('student.index', compact('game_id', 'game'));
//        }
//        if ($game->type == 'hacking') {
//            return view('student.hacking.hacking_password', compact('game_id', 'game'));
//        }

    }

    public function choose_password($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        return view('student.hacking.hacking_password', compact('game_id', 'game'));
    }

    public function startTimer($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        return view('student.startTimer', compact('game_id', 'game'));
    }

    public function student_question($game_id, Request $request)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        if ($game->type == 'hacking') {
//            echo '<script>localStorage.removeItem("current_question");</script>';
            return view('student.hacking.question', compact('game_id', 'game'));
        } elseif ($game->type == 'gold_quest') {
//            echo '<script>localStorage.removeItem("current_question");</script>';
            return view('student.gold_quest.question', compact('game_id', 'game'));
        } else {
            return view('student.question', compact('game_id', 'game'));
        }
    }

    public function student_save_password($game_id, $password)
    {
        echo '<script>localStorage.removeItem("current_question");</script>';
        echo '<script>localStorage.removeItem("countdownEndTime");</script>';
        $game = Game1::with(['questions'])->where('id', $game_id)->first();

//        dd($request->pass);
        $user = auth()->guard('student')->user();
        $user->game_password = $password;
        $user->save();
//        dd($user);
//            return view('student.question', compact('game_id', 'game'));
        return redirect()->to('/student/'.$game_id);
//        return view('student.question', compact('game_id', 'game'));
    }

    public function student_facts($game_id)
    {
        echo '<script>localStorage.removeItem("current_question");localStorage.removeItem("countdownEndTime");</script>';
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
            ->take(3)
            ->get();

        $student_answers = StudentAnswerGame::with(['question_game', 'question_game.game', 'question_game.game.questions', 'student', 'student.questions_answer' => function($q) {
            $q->whereDate('created_at', date('Y-m-d'));
        }])
            ->whereDate('created_at', date('Y-m-d'))
            ->whereHas('question_game', function($q) use($game_id) {
                $q->where('game1_id', $game_id);
            })
            ->where('student_id', auth()->user()->id)
            ->get();
//        dd($student_answers);
        return view('student.facts', compact('game_id', 'game', 'students_answer', 'student_answers'));
    }

    public function student_answerList($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        $student_answers = StudentAnswerGame::with(['question_game', 'question_game.game', 'question_game.game.questions', 'student', 'student.questions_answer' => function($q) {
            $q->whereDate('created_at', date('Y-m-d'));
        }])
            ->whereDate('created_at', date('Y-m-d'))
            ->whereHas('question_game', function($q) use($game_id) {
                $q->where('game1_id', $game_id);
            })
            ->where('student_id', auth()->user()->id)
            ->get();
//        dd($student_answers);
        return view('student.answerList', compact('game_id', 'game', 'student_answers'));
    }

    public function answer_question(Request $request)
    {
        $user = auth()->guard('student')->user();
        $game = Game1::with(['questions'])->where('id', $request->game_id)->first();
        $old_answer = StudentAnswerGame::where('game_question_id', $request->question_id)
            ->where('student_id', $user->id)
            ->whereDate('created_at', date('Y-m-d'))
            ->first();
        if ($game->type == 'classic') {
            $user->games_coins = (int)$user->games_coins + 1;
            $user->save();
        }
        if ($old_answer) {
            $old_answer->answer = $request->answer;
            $old_answer->correct = $request->correct == 'true' ? 1 : 0;
            $old_answer->save();
            $answer = StudentAnswerGame::with(['question_game'])->where('id', $old_answer->id)->first();
        } else {
            $answer = new StudentAnswerGame();
            $answer->game_question_id = $request->question_id;
            $answer->student_id = $user->id;
            $answer->answer = $request->answer;
            $answer->correct = $request->correct == 'true' ? 1 : 0;
            $answer->save();
            $answer = StudentAnswerGame::with(['question_game'])->where('id', $answer->id)->first();
        }
//        $answer = new StudentAnswerGame();
//        $answer->game_question_id = $request->question_id;
//        $answer->student_id = $user->id;
//        $answer->answer = $request->answer;
//        $answer->correct = $request->correct == 'true' ? 1 : 0;
//        $answer->save();

        broadcast(new \App\Events\UserStatusChanged(auth()->guard('student')->user(), $answer->correct, $answer->question_game->game1_id))->toOthers();
        return response()->json(['error' => false, 'message' => 'Successful', 'data' => []], 200);
    }

    public function show_gifts($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        if ($game->type == 'hacking') {
            return view('student.hacking.gifts', compact('game_id', 'game'));
        } elseif ($game->type == 'gold_quest') {
            return view('student.gold_quest.gifts', compact('game_id', 'game'));
        }
    }

    public function save_gift(Request $request)
    {
        $user = auth()->guard('student')->user();
        if ($request->coins) {
            $user->games_coins = (int)$user->games_coins + (int)$request->coins;
        } else {
            $user->games_coins = (int)$user->games_coins + 5;
        }
        $user->save();
        return response()->json(['error' => false, 'message' => 'Successful', 'data' => $user], 200);
    }

    public function show_password_hacking($game_id)
    {
        $game = Game1::with(['questions'])->where('id', $game_id)->first();
        $student_pass = Student::whereNotNull('game_password')
            ->where('id', '!=', auth()->user()->id)
            ->inRandomOrder()
            ->first();

        $passwords = [];
        while (count($passwords) < 2) {
            $newPassword = $this->generatePassword(6);
            if (!in_array($newPassword, $passwords)) {
                $passwords[] = $newPassword;
            }
        }
        $passwords[] = $student_pass->game_password;
        shuffle($passwords);
//        dd($passwords);
        return view('student.hacking.hacking', compact('game_id', 'game', 'student_pass', 'passwords'));

    }

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

    public function save_password_hacking (Request $request)
    {
        $student_pass = Student::where('id', $request->id)->first();
        $coins = 0;
        if ($student_pass->games_coins) {
            $coins = (int)$student_pass->games_coins * 0.15;
        }
        $user = auth()->guard('student')->user();
        $user->games_coins = (int)$user->games_coins + $coins;
        $user->save();
        return response()->json(['error' => false, 'message' => 'Successful', 'data' => []], 200);
    }

}
