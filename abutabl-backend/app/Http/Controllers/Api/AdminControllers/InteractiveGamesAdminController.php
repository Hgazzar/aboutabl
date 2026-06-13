<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Events\InteractiveGameStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\InteractiveGame;
use App\Models\InteractiveStudentAnswer;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InteractiveGamesAdminController extends Controller
{
    use GeneralTrait;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

    public function index(Request $request)
    {
        try {
            $games = InteractiveGame::with(['questions'])->latest()->get();

            return $this->returnData('games', $games, '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function show($id)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($id);

            return $this->returnData('game', $game, '', 200);
        } catch (\Exception $ex) {
            return $this->returnError('404', __('api.not_found'), 404);
        }
    }

    public function startRound(Request $request, $id)
    {
        try {
            InteractiveGame::findOrFail($id);
            $user = auth('admin-api')->user();
            broadcast(new InteractiveGameStatusChanged($user, true, (int) $id))->toOthers();

            return $this->returnSuccessMessage(__('api.success'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function facts(Request $request, $id)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($id);

            $studentsAnswer = InteractiveStudentAnswer::with(['question', 'student'])
                ->whereDate('created_at', date('Y-m-d'))
                ->whereHas('question', function ($q) use ($id) {
                    $q->where('interactive_game_id', $id);
                })
                ->select('student_id', DB::raw('SUM(correct) as total_answer'))
                ->groupBy('student_id')
                ->orderByDesc('total_answer')
                ->get();

            $user = auth('admin-api')->user();
            broadcast(new InteractiveGameStatusChanged($user, false, (int) $id))->toOthers();

            return $this->returnData('data', [
                'game' => $game,
                'leaderboard' => $studentsAnswer,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function studentAnswers(Request $request, $gameId, $studentId)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($gameId);

            $studentAnswers = InteractiveStudentAnswer::with(['question', 'student'])
                ->whereDate('created_at', date('Y-m-d'))
                ->whereHas('question', function ($q) use ($gameId) {
                    $q->where('interactive_game_id', $gameId);
                })
                ->where('student_id', $studentId)
                ->get();

            return $this->returnData('data', [
                'game' => $game,
                'student_answers' => $studentAnswers,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }
}
