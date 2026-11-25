<?php

namespace Tests\Feature\QuizRuntime;

use App\Http\Middleware\EnsureQuizLibraryAdminOnly;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class QuizScoreToPassAuthorizationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            $this->markTestSkipped('Authorization checks run only on sqlite :memory:.');
        }
    }

    public function test_quiz_library_middleware_rejects_a_teacher(): void
    {
        auth()->setDefaultDriver('admin-api');
        $teacher = new User();
        $teacher->type = 'user';
        auth('admin-api')->setUser($teacher);

        $this->expectException(HttpException::class);

        (new EnsureQuizLibraryAdminOnly())->handle(
            Request::create('/api/quizes/list_fields/1', 'POST'),
            function () {
                return 'allowed';
            }
        );
    }

    public function test_quiz_library_middleware_allows_an_admin(): void
    {
        auth()->setDefaultDriver('admin-api');
        $admin = new User();
        $admin->type = 'admin';
        auth('admin-api')->setUser($admin);

        $response = (new EnsureQuizLibraryAdminOnly())->handle(
            Request::create('/api/quizes/list_fields/1', 'POST'),
            function () {
                return 'allowed';
            }
        );

        $this->assertSame('allowed', $response);
    }
}
