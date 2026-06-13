<?php

namespace Database\Seeders;

use App\Models\Game1;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class GameTestAccountSeeder extends Seeder
{
    /**
     * Seeds test accounts to log into the game.
     * Run: php artisan db:seed --class=GameTestAccountSeeder
     */
    public function run()
    {
        $email = 'teacher@test.com';
        $password = 'password';

        // Use same hash as Laravel's default (password = "password")
        $passwordHash = Hash::make($password);

        $user = User::where('email', $email)->first();
        if ($user) {
            $user->password = $passwordHash;
            $user->save();
        } else {
            $user = User::create([
                'name' => 'Test Teacher',
                'email' => $email,
                'username' => 'teacher_test_' . time(),
                'password' => $passwordHash,
            ]);
        }

        $this->command->info('Test account ready:');
        $this->command->info('  Email:    ' . $email);
        $this->command->info('  Password: ' . $password);
        $this->command->info('  Use as:   Teacher (or Admin)');
        $this->command->info('');
        $this->command->info('How to log in:');
        $this->command->info('  1. Open http://127.0.0.1:8000/teacher/games/index');
        $this->command->info('  2. You will be sent to login – use the email and password above.');
        $this->command->info('  3. After login you will need to select a game (create one in admin if none exist).');
    }
}
