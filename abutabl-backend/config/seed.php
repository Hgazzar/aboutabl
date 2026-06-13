<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Schools roster path
    |--------------------------------------------------------------------------
    |
    | Path to the directory containing school roster Excel files. Each .xlsx
    | file is treated as one school (filename without extension = school name).
    | Default is one level up from backend root: ../Schools roster
    |
    */
    'schools_roster_path' => env('SEED_SCHOOLS_ROSTER_PATH', base_path('../Schools roster')),

];
