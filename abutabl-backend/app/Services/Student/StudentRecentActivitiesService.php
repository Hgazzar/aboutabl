<?php

namespace App\Services\Student;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\StudentLessonContentCompletion;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

/**
 * Widget 6 — Recent Activities from real lesson content completions + XP ledger.
 */
class StudentRecentActivitiesService
{
    /** @var StudentXpService */
    private $xp;

    public function __construct(StudentXpService $xp)
    {
        $this->xp = $xp;
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, has_more: bool}
     */
    public function buildDashboardPayload(int $studentId, int $limit = 2): array
    {
        if (! Schema::hasTable('student_lesson_content_completions')) {
            return ['items' => [], 'has_more' => false];
        }

        $limit = max(1, $limit);
        $query = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->orderByDesc('completed_at');

        $total = (clone $query)->count();
        $rows = $query->limit($limit)->get();

        $items = [];
        foreach ($rows as $row) {
            $contentId = (int) $row->lesson_content_id;
            $lessonId = (int) $row->lesson_id;
            $labels = $this->resolveContentLabels($contentId, $lessonId);
            $xpEarned = $this->xp->earnedXpForSource($studentId, 'lesson_content', (int) $row->id);

            $items[] = [
                'kind'          => 'lesson_content',
                'available'     => true,
                'content_label' => $labels['content_label'],
                'subject_name'  => $labels['subject_name'],
                'subject_id'    => $labels['subject_id'],
                'content_id'    => $contentId,
                'lesson_id'     => $lessonId,
                'occurred_at'   => Carbon::parse($row->completed_at)->toIso8601String(),
                'xp_earned'     => $xpEarned,
                'visual'        => 'bird_books_sm',
                'theme'         => 'cream',
            ];
        }

        return [
            'items'    => $items,
            'has_more' => $total > $limit,
        ];
    }

    /**
     * @return array{content_label: string, subject_name: string, subject_id: int|null}
     */
    private function resolveContentLabels(int $contentId, int $lessonId): array
    {
        $locale = app()->getLocale() === 'ar' ? 'ar' : 'en';
        $nameCol = 'name_'.$locale;
        $fallbackCol = $locale === 'ar' ? 'name_en' : 'name_ar';

        $content = LessonsContents::query()->find($contentId);
        $contentLabel = $content
            ? (string) ($content->{$nameCol} ?? $content->{$fallbackCol} ?? '')
            : '';

        $lesson = Lessons::query()->find($lessonId);
        $subjectId = $lesson ? (int) $lesson->subject_id : null;
        $subjectName = '';

        if ($subjectId) {
            $subject = Subject::query()->find($subjectId);
            if ($subject) {
                $subjectName = (string) ($locale === 'ar'
                    ? ($subject->name_ar ?: $subject->name)
                    : ($subject->name ?: $subject->name_ar));
            }
        }

        return [
            'content_label' => $contentLabel,
            'subject_name'  => $subjectName,
            'subject_id'    => $subjectId,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     *
     * @deprecated Use buildDashboardPayload() for Widget 6.
     */
    public function build(int $teacherId, int $studentId, string $range, int $limit = 10): array
    {
        unset($teacherId, $range);

        return $this->buildDashboardPayload($studentId, $limit)['items'];
    }
}
