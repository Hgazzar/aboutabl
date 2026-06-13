<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Events\InteractiveGameStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\InteractiveGame;
use App\Models\InteractiveGameQuestion;
use App\Models\InteractiveStudentAnswer;
use App\Models\Student;
use App\Traits\GeneralTrait;
use App\Traits\GeneratesInteractiveGamePasswords;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InteractiveGamesStudentController extends Controller
{
    use GeneralTrait;
    use GeneratesInteractiveGamePasswords;

    public function __construct()
    {
        auth()->setDefaultDriver('user-api');
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

            return $this->returnData('game', $this->sanitizeGameForStudent($game), '', 200);
        } catch (\Exception $ex) {
            return $this->returnError('404', __('api.not_found'), 404);
        }
    }

    public function questions($id)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($id);
            $payload = [
                'game' => [
                    'id' => $game->id,
                    'name' => $game->name,
                    'logo' => $game->logo,
                    'time' => $game->time,
                    'type' => $game->type,
                ],
                'questions' => $game->questions->map(function (InteractiveGameQuestion $q) {
                    return $this->sanitizeQuestionForStudent($q);
                })->values(),
            ];

            return $this->returnData('data', $payload, '', 200);
        } catch (\Exception $ex) {
            return $this->returnError('404', __('api.not_found'), 404);
        }
    }

    public function answerQuestion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'game_id' => 'required|integer|exists:interactive_games,id',
            'question_id' => 'required|integer|exists:interactive_game_questions,id',
            'answer' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->returnValidationError('E001', $validator);
        }

        try {
            /** @var Student $user */
            $user = auth('user-api')->user();
            $game = InteractiveGame::with(['questions'])->where('id', $request->game_id)->firstOrFail();
            $question = InteractiveGameQuestion::where('id', $request->question_id)
                ->where('interactive_game_id', $game->id)
                ->firstOrFail();

            $correct = trim((string) $question->correct_answer) === trim((string) $request->answer);

            $oldAnswer = InteractiveStudentAnswer::where('interactive_game_question_id', $question->id)
                ->where('student_id', $user->id)
                ->whereDate('created_at', date('Y-m-d'))
                ->first();

            // Legacy behaviour: +1 coin on every answer submission for classic games (not only when correct).
            if ($game->type === 'classic') {
                $user->games_coins = (int) $user->games_coins + 1;
                $user->save();
            }

            if ($oldAnswer) {
                $oldAnswer->answer = (string) $request->answer;
                $oldAnswer->correct = $correct ? 1 : 0;
                $oldAnswer->save();
            } else {
                $answer = new InteractiveStudentAnswer();
                $answer->interactive_game_question_id = $question->id;
                $answer->student_id = $user->id;
                $answer->answer = (string) $request->answer;
                $answer->correct = $correct ? 1 : 0;
                $answer->save();
            }

            $user->refresh();

            broadcast(new InteractiveGameStatusChanged($user, $correct, (int) $game->id))->toOthers();

            return $this->returnData('data', [
                'correct' => $correct,
                'games_coins' => (int) $user->games_coins,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function savePassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:4|max:128',
        ]);

        if ($validator->fails()) {
            return $this->returnValidationError('E001', $validator);
        }

        try {
            InteractiveGame::findOrFail($id);
            /** @var Student $user */
            $user = auth('user-api')->user();
            $user->game_password = $request->password;
            $user->save();

            return $this->returnSuccessMessage(__('api.success'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function showPasswordHacking($id)
    {
        try {
            InteractiveGame::where('id', $id)->whereIn('type', ['hacking', 'gold_quest'])->firstOrFail();

            /** @var Student $me */
            $me = auth('user-api')->user();

            $studentPass = Student::whereNotNull('game_password')
                ->where('id', '!=', $me->id)
                ->inRandomOrder()
                ->first();

            if (! $studentPass) {
                return $this->returnError('E404', 'No other students with a game password yet.', 404);
            }

            $passwords = [];
            while (count($passwords) < 2) {
                $p = $this->generateInteractiveGamePassword(6);
                if (! in_array($p, $passwords, true)) {
                    $passwords[] = $p;
                }
            }
            $passwords[] = (string) $studentPass->game_password;
            shuffle($passwords);

            return $this->returnData('data', [
                'target_student_id' => $studentPass->id,
                'target_student_name' => (string) ($studentPass->name ?? $studentPass->name_ar ?? ''),
                'passwords' => $passwords,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function savePasswordHacking(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
            'password_guess' => 'required|string|max:256',
        ]);

        if ($validator->fails()) {
            return $this->returnValidationError('E001', $validator);
        }

        try {
            $studentPass = Student::where('id', $request->id)->firstOrFail();
            /** @var Student $user */
            $user = auth('user-api')->user();

            $actual = (string) ($studentPass->game_password ?? '');
            if (trim($actual) !== trim((string) $request->password_guess)) {
                return $this->returnError('E400', __('api.logindatanotcorrect'), 400);
            }

            $coins = 0;
            if ($studentPass->games_coins) {
                $coins = (int) floor((int) $studentPass->games_coins * 0.15);
            }
            $user->games_coins = (int) $user->games_coins + $coins;
            $user->save();

            return $this->returnData('data', [
                'games_coins' => (int) $user->games_coins,
                'coins_gained' => $coins,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function gifts(Request $request, $id)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($id);
            if (! in_array($game->type, ['hacking', 'gold_quest'], true)) {
                return $this->returnError('E400', 'Gifts not available for this game type.', 400);
            }

            return $this->returnData('game', $this->sanitizeGameForStudent($game), '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Server-authoritative random gift outcome (hacking crates or gold quest chests).
     */
    public function pullGift(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'variant' => 'required|string|in:hacking,gold_quest',
        ]);

        if ($validator->fails()) {
            return $this->returnValidationError('E001', $validator);
        }

        try {
            $game = InteractiveGame::findOrFail($id);
            $variant = $request->input('variant');

            if ($variant === 'hacking' && $game->type !== 'hacking') {
                return $this->returnError('E400', 'Invalid variant for this game.', 400);
            }
            if ($variant === 'gold_quest' && $game->type !== 'gold_quest') {
                return $this->returnError('E400', 'Invalid variant for this game.', 400);
            }

            /** @var Student $user */
            $user = auth('user-api')->user();

            if ($variant === 'hacking') {
                $outcomes = ['hacked', 'luck', 'gold'];
                $picked = $outcomes[array_rand($outcomes)];

                if ($picked === 'gold') {
                    $user->games_coins = (int) $user->games_coins + 5;
                    $user->save();
                }

                return $this->returnData('data', [
                    'outcome' => $picked,
                    'games_coins' => (int) $user->fresh()->games_coins,
                    'coins_delta' => $picked === 'gold' ? 5 : 0,
                ], '', 200);
            }

            // gold_quest
            $tiers = [
                ['key' => 'gold1', 'coins' => 5],
                ['key' => 'gold2', 'coins' => 10],
                ['key' => 'gold3', 'coins' => 20],
            ];
            $tier = $tiers[array_rand($tiers)];
            $user->games_coins = (int) $user->games_coins + $tier['coins'];
            $user->save();

            return $this->returnData('data', [
                'outcome' => $tier['key'],
                'coins_delta' => $tier['coins'],
                'games_coins' => (int) $user->fresh()->games_coins,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function saveGift(Request $request)
    {
        try {
            /** @var Student $user */
            $user = auth('user-api')->user();
            if ($request->filled('coins')) {
                $user->games_coins = (int) $user->games_coins + (int) $request->coins;
            } else {
                $user->games_coins = (int) $user->games_coins + 5;
            }
            $user->save();

            return $this->returnData('student', [
                'id' => $user->id,
                'games_coins' => (int) $user->games_coins,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function facts(Request $request, $id)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($id);
            /** @var Student $me */
            $me = auth('user-api')->user();

            $topRows = InteractiveStudentAnswer::query()
                ->whereDate('created_at', date('Y-m-d'))
                ->whereHas('question', function ($q) use ($id) {
                    $q->where('interactive_game_id', $id);
                })
                ->select('student_id', DB::raw('SUM(correct) as total_answer'))
                ->groupBy('student_id')
                ->orderByDesc('total_answer')
                ->take(3)
                ->get();

            $studentsAnswer = $topRows->map(function ($row) {
                $st = Student::find($row->student_id);

                return [
                    'student_id' => (int) $row->student_id,
                    'total_answer' => (int) $row->total_answer,
                    'name' => $st ? (string) ($st->name ?? $st->name_ar ?? '') : '',
                ];
            });

            $studentAnswers = InteractiveStudentAnswer::with(['question', 'student'])
                ->whereDate('created_at', date('Y-m-d'))
                ->whereHas('question', function ($q) use ($id) {
                    $q->where('interactive_game_id', $id);
                })
                ->where('student_id', $me->id)
                ->get();

            $myCorrect = $studentAnswers->where('correct', 1)->count();
            $totalQs = max(1, $game->questions->count());

            return $this->returnData('data', [
                'game' => $this->sanitizeGameForStudent($game),
                'top_students' => $studentsAnswer,
                'my_answers' => $studentAnswers,
                'my_correct_count' => $myCorrect,
                'questions_total' => $totalQs,
                'is_first_place' => $studentsAnswer->isNotEmpty()
                    && (int) $studentsAnswer->first()['student_id'] === (int) $me->id,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function answerList(Request $request, $id)
    {
        try {
            $game = InteractiveGame::with(['questions'])->findOrFail($id);
            /** @var Student $me */
            $me = auth('user-api')->user();

            $studentAnswers = InteractiveStudentAnswer::with(['question', 'student'])
                ->whereDate('created_at', date('Y-m-d'))
                ->whereHas('question', function ($q) use ($id) {
                    $q->where('interactive_game_id', $id);
                })
                ->where('student_id', $me->id)
                ->get();

            return $this->returnData('data', [
                'game' => $this->sanitizeGameForStudent($game),
                'student_answers' => $studentAnswers,
            ], '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    protected function sanitizeGameForStudent(InteractiveGame $game): array
    {
        return [
            'id' => $game->id,
            'name' => $game->name,
            'logo' => $game->logo,
            'time' => $game->time,
            'type' => $game->type,
            'questions_count' => $game->questions->count(),
        ];
    }

    protected function sanitizeQuestionForStudent(InteractiveGameQuestion $q): array
    {
        return [
            'id' => $q->id,
            'question' => $q->question,
            'answer1' => $q->answer1,
            'answer2' => $q->answer2,
            'answer3' => $q->answer3,
            'answer4' => $q->answer4,
            'correct_answer' => $q->correct_answer,
            'explanation' => $q->explanation,
            'image' => $q->image,
            'voice_url' => $q->voice_url,
            'answer_type' => $q->answer_type,
            'sort_order' => $q->sort_order,
        ];
    }
}
