<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MakeUsersPhoneAndEmailNullable extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE users MODIFY phone CHAR(15) NULL');
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(150) NULL');
    }

    public function down()
    {
        DB::statement('ALTER TABLE users MODIFY phone CHAR(15) NOT NULL');
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(150) NOT NULL');
    }
}
