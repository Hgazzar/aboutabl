<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
      public function run()
    {
        Schema::disableForeignKeyConstraints();
        $role = Role::where("name", "super-admin")->first();



        $permissions1 = [
            "lenssons",
            "contents",
            "quizes",
            "questions",
            "file_managers",

        ];

         foreach ($permissions1 as $p) {
            foreach (["view", "add", "edit", "activation","export","delete"] as $option) {
                if (!Permission::where("name", $option . "-" . $p)->exists()) {
                    $permission = new Permission();
                    $permission->name = "$option-" . $p;
                    $permission->guard_name = "admin-api";
                    $permission->save();

                    dump("added $permission->name");
                }
            }
        }

       
       $role->givePermissionTo(Permission::all());
        Schema::enableForeignKeyConstraints();
    }
}
