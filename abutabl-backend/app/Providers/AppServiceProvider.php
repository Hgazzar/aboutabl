<?php

namespace App\Providers;

use Laravel\Passport\Passport;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use App\Contracts\StudentInsightProviderInterface;
use App\Models\AssignsStudents;
use App\Models\Lessons;
use App\Models\Quizes;
use App\Models\StudentSubjectProgress;
use App\Observers\AssignsStudentsObserver;
use App\Observers\LessonsObserver;
use App\Observers\QuizesObserver;
use App\Observers\StudentSubjectProgressObserver;
use App\Services\StudentProfile\NullStudentInsightProvider;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(
            StudentInsightProviderInterface::class,
            NullStudentInsightProvider::class
        );
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Schema::defaultStringLength(191);
        Passport::routes();

        Lessons::observe(LessonsObserver::class);
        Quizes::observe(QuizesObserver::class);
        AssignsStudents::observe(AssignsStudentsObserver::class);
        StudentSubjectProgress::observe(StudentSubjectProgressObserver::class);
    }
}
