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

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
      public function run()
    {
        Schema::disableForeignKeyConstraints();
        Role::truncate();
        Permission::truncate();
        if (!Role::where("name", "super-admin")->exists()) {
            $role = new Role([
                "name" => "super-admin",
                "guard_name" => "admin-api",
                "scope" => "public",
            ]);
            $role->save();
        } else {
            $role = Role::where("name", "super-admin")->first();

        }
       
     
        $permissions = [
            "roles",
            "teachers",
            "users",
            "subjects",
            "students",
            "schools",
            "classes",
            "units",
            "grades",
            "games",
            "worksheets",
            "lessons",
            "tickets",
        ];

        foreach ($permissions as $p) {
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

        if (User::where("email", "super-admin@gmail.com")->count() == 0) {
            $admin = User::create([
                "name" => "Super-Admin",
                "username" => "super_admin",
                "password" => bcrypt(123456789),
                "email" => "super-admin@gmail.com",
                "status" => 1,
                "verify" =>1,
                "phone" => "0123456545"
            ]);

            $admin->roles()->save($role);
            return;
        }
        User::where("email", "super-admin@gmail.com")->first()->assignRole($role);
        Schema::enableForeignKeyConstraints();



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
