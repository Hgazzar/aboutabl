<?php

use Illuminate\Database\Seeder;
use Database\Seeders\AdminSeeder;
use Database\Seeders\InteractiveGamesSeeder;
use Database\Seeders\PermissionsSeeder;
use Database\Seeders\SchoolsRosterSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            AdminSeeder::class,
            PermissionsSeeder::class,
            SchoolsRosterSeeder::class,
            InteractiveGamesSeeder::class,
        ]);

    }
}
