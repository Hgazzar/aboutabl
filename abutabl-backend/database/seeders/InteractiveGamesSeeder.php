<?php

namespace Database\Seeders;

use App\Models\InteractiveGame;
use App\Models\InteractiveGameQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * Seeds demo interactive games: classic, hacking, gold_quest (+ questions). Idempotent.
 *
 * Run: php artisan db:seed --class=Database\\Seeders\\InteractiveGamesSeeder
 */
class InteractiveGamesSeeder extends Seeder
{
    public function run()
    {
        if (! Schema::hasTable('interactive_games')) {
            $this->command->warn('Table interactive_games does not exist; run migrations first.');

            return;
        }

        $adminId = User::query()->orderBy('id')->value('id');
        $hasExplanation = Schema::hasColumn('interactive_game_questions', 'explanation');

        $classic = InteractiveGame::firstOrCreate(
            ['name' => 'Demo classic'],
            [
                'logo' => null,
                'time' => '05:00',
                'type' => 'classic',
                'status' => 1,
                'created_by' => $adminId,
            ]
        );

        $this->seedQuestions($classic, [
            [
                'question' => '2 + 2 = ?',
                'correct_answer' => '4',
                'explanation' => 'Addition of two and two.',
                'answer1' => '3',
                'answer2' => '4',
                'answer3' => '5',
                'answer4' => '6',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'options' => null,
                'sort_order' => 0,
            ],
            [
                'question' => 'Capital of France?',
                'correct_answer' => 'Paris',
                'explanation' => 'Paris is the capital and largest city of France.',
                'answer1' => 'London',
                'answer2' => 'Paris',
                'answer3' => 'Berlin',
                'answer4' => 'Madrid',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'options' => null,
                'sort_order' => 1,
            ],
        ], $hasExplanation);

        $hacking = InteractiveGame::firstOrCreate(
            ['name' => 'Demo Hacking'],
            [
                'logo' => null,
                'time' => '05:00',
                'type' => 'hacking',
                'status' => 1,
                'created_by' => $adminId,
            ]
        );

        $this->seedQuestions($hacking, [
            [
                'question' => 'Which port is HTTPS?',
                'correct_answer' => '443',
                'explanation' => 'HTTPS typically uses TCP port 443.',
                'answer1' => '80',
                'answer2' => '443',
                'answer3' => '22',
                'answer4' => '3306',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'options' => null,
                'sort_order' => 0,
            ],
            [
                'question' => 'What does CPU stand for?',
                'correct_answer' => 'Central Processing Unit',
                'explanation' => 'The CPU executes instructions of a computer program.',
                'answer1' => 'Central Processing Unit',
                'answer2' => 'Computer Personal Unit',
                'answer3' => 'Core Power Utility',
                'answer4' => 'Cached Program Upload',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'options' => null,
                'sort_order' => 1,
            ],
        ], $hasExplanation);

        $goldQuest = InteractiveGame::firstOrCreate(
            ['name' => 'Demo Gold Quest'],
            [
                'logo' => null,
                'time' => '05:00',
                'type' => 'gold_quest',
                'status' => 1,
                'created_by' => $adminId,
            ]
        );

        $this->seedQuestions($goldQuest, [
            [
                'question' => 'Largest planet in our solar system?',
                'correct_answer' => 'Jupiter',
                'explanation' => 'Jupiter is a gas giant and the most massive planet.',
                'answer1' => 'Earth',
                'answer2' => 'Mars',
                'answer3' => 'Jupiter',
                'answer4' => 'Saturn',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'options' => null,
                'sort_order' => 0,
            ],
            [
                'question' => 'How many bits in a byte?',
                'correct_answer' => '8',
                'explanation' => 'A byte is traditionally 8 bits.',
                'answer1' => '4',
                'answer2' => '8',
                'answer3' => '16',
                'answer4' => '32',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'options' => null,
                'sort_order' => 1,
            ],
        ], $hasExplanation);

        $this->command->info(sprintf(
            'Interactive games: classic id %d (%d Q), hacking id %d (%d Q), gold_quest id %d (%d Q).',
            $classic->id,
            $classic->questions()->count(),
            $hacking->id,
            $hacking->questions()->count(),
            $goldQuest->id,
            $goldQuest->questions()->count()
        ));
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function seedQuestions(InteractiveGame $game, array $rows, bool $hasExplanation): void
    {
        foreach ($rows as $row) {
            if (! $hasExplanation) {
                unset($row['explanation']);
            }
            InteractiveGameQuestion::firstOrCreate(
                [
                    'interactive_game_id' => $game->id,
                    'question' => $row['question'],
                ],
                array_merge($row, ['interactive_game_id' => $game->id])
            );
        }
    }
}
