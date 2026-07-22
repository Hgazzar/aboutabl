<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LessonContent\CompleteLessonContentRequest;
use App\Services\LessonContentCompletionRuntimeService;
use App\Traits\GeneralTrait;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * F-030 — Student lesson content completion runtime entry.
 */
class LessonContentCompletionController extends Controller
{
    use GeneralTrait;

    /** @var LessonContentCompletionRuntimeService */
    private $runtime;

    public function __construct(LessonContentCompletionRuntimeService $runtime)
    {
        $this->runtime = $runtime;
        auth()->setDefaultDriver('user-api');
    }

    public function complete(CompleteLessonContentRequest $request, $contentId)
    {
        try {
            $studentId = (int) Auth::guard('user-api')->id();
            if ($studentId <= 0) {
                return $this->returnError('E401', 'Unauthenticated.', 401);
            }

            $data = $this->runtime->complete(
                $studentId,
                (int) $contentId,
                (array) $request->input('evidence', [])
            );

            return $this->returnData('data', $data, 'Content completion recorded.');
        } catch (NotFoundHttpException $e) {
            return $this->returnError('E404', $e->getMessage(), 404);
        } catch (AccessDeniedHttpException $e) {
            return $this->returnError('E403', $e->getMessage(), 403);
        } catch (InvalidArgumentException $e) {
            return $this->returnError('E422', $e->getMessage(), 422);
        } catch (Throwable $e) {
            return $this->returnError('E500', $e->getMessage(), 500);
        }
    }
}
