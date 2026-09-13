<?php

namespace Database\Seeders;

use App\Models\AssignActivitySubmission;
use App\Models\AssignmentGrade;
use App\Models\AssignsStudents;
use App\Models\Classes;
use App\Models\Grades;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\Notification\NotificationInboxService;
use App\Services\Student\StudentXpService;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * STAGING-DEMO-001 — self-contained staging demo dataset.
 *
 * Creates one Admin, one Teacher, one Student in an isolated demo school with
 * curriculum access, sample progress, a graded assignment, XP sync, and a
 * notification — without changing product APIs or Production data.
 *
 * Safety:
 *   - Refuses production (and unknown envs unless force + non-prod).
 *   - NOT wired into DatabaseSeeder.
 *
 * Run (staging / local DB only):
 *   php artisan db:seed --class=StagingDemoDatasetSeeder
 *
 * Optional force on non-production unknown env:
 *   STAGING_DEMO_SEED_FORCE=1 php artisan db:seed --class=StagingDemoDatasetSeeder
 *
 * Demo logins (password for all: StagingDemo123!):
 *   Admin   — admin.demo@aboutabl.com  (or username admin.demo)
 *   Teacher — teacher.demo@aboutabl.com (or username teacher.demo)
 *   Student — student.demo@aboutabl.com (or code STAGINGDEMO01)
 */
class StagingDemoDatasetSeeder extends Seeder
{
    private const MARKER = '[Staging Demo]';

    private const COMPLETION_SOURCE = 'staging_demo_seed';

    private const SCHOOL_NAME = '[Staging Demo] School';

    private const GRADE_NAME = '[Staging Demo] Grade 5';

    private const CLASS_NAME = '[Staging Demo] Class 5A';

    private const SUBJECT_NAME = '[Staging Demo] English';

    private const UNIT_NAME = '[Staging Demo] Unit 1 — Foundations';

    private const LESSON_NAME = '[Staging Demo] Lesson 1 — Welcome';

    private const CONTENT_NAME = '[Staging Demo] Intro Reading';

    private const ASSIGN_TITLE = '[Staging Demo] Graded Homework';

    private const PASSWORD = 'StagingDemo123!';

    private const ADMIN_EMAIL = 'admin.demo@aboutabl.com';

    private const ADMIN_USERNAME = 'admin.demo';

    private const TEACHER_EMAIL = 'teacher.demo@aboutabl.com';

    private const TEACHER_USERNAME = 'teacher.demo';

    private const STUDENT_EMAIL = 'student.demo@aboutabl.com';

    private const STUDENT_USERNAME = 'STAGINGDEMO01';

    /** @var array<int, string> */
    private const STAGING_CONNECTIONS = ['staging', 'mysql_staging'];

    public function run(): void
    {
        $this->assertSafeEnvironment();

        if (! Schema::hasTable('schools') || ! Schema::hasTable('students') || ! Schema::hasTable('users')) {
            throw new RuntimeException('Core tables missing; aborting StagingDemoDatasetSeeder.');
        }

        DB::transaction(function () {
            $roles = $this->ensureRolesAndPermissions();
            $school = $this->ensureSchool();
            $grade = $this->ensureGrade((int) $school->id);
            $class = $this->ensureClass((int) $school->id, (int) $grade->id);
            $admin = $this->ensureAdmin($roles['superAdmin']);
            $teacher = $this->ensureTeacher($school, $grade, $class, $roles['teacher']);
            $student = $this->ensureStudent($school, $grade, $class);
            $subject = $this->ensureSubjectWithAccess($school, $grade, $class, $teacher);
            $this->ensureTeacherSubjectLink($teacher, $school, $grade, $class, $subject);
            $curriculum = $this->ensureCurriculum($school, $subject);
            $this->ensureLessonProgress((int) $student->id, $subject, $curriculum);
            $this->ensureSubjectProgressPercent((int) $student->id, (int) $subject->id);
            $assign = $this->ensureGradedAssignment($student, $teacher, $subject, $grade, $curriculum);
            $this->ensureNotification($student, $teacher, $subject, $assign['assign_id']);

            $this->command?->info('Staging demo graph ready.');
            $this->command?->info('  School #'.$school->id.' '.$school->name);
            $this->command?->info('  Admin   '.$admin->email.' / '.self::PASSWORD);
            $this->command?->info('  Teacher '.$teacher->email.' / '.self::PASSWORD);
            $this->command?->info('  Student '.$student->email.' (code '.$student->username.') / '.self::PASSWORD);
            $this->command?->info('  Subject #'.$subject->id.' '.$subject->name);
            $this->command?->info('  Assign  #'.$assign['assign_id'].' '.$assign['title']);
        });

        $student = Student::query()->where('username', self::STUDENT_USERNAME)->first();
        if ($student) {
            /** @var StudentXpService $xp */
            $xp = app(StudentXpService::class);
            $payload = $xp->syncAndGet((int) $student->id);
            $this->command?->info('  XP synced: total_xp='.($payload['total_xp'] ?? 0));
        }
    }

    private function assertSafeEnvironment(): void
    {
        $env = strtolower((string) app()->environment());
        $connection = strtolower((string) config('database.default'));
        $force = filter_var(env('STAGING_DEMO_SEED_FORCE', false), FILTER_VALIDATE_BOOLEAN);

        if (in_array($env, ['production', 'prod'], true)) {
            throw new RuntimeException(
                'StagingDemoDatasetSeeder refused: APP_ENV is production. Staging DB only.'
            );
        }

        if (in_array($env, ['local', 'staging'], true)) {
            return;
        }

        if (in_array($connection, self::STAGING_CONNECTIONS, true)) {
            return;
        }

        if ($force) {
            $this->command?->warn(
                'STAGING_DEMO_SEED_FORCE=1 — running outside local/staging (env='.$env.', connection='.$connection.').'
            );

            return;
        }

        throw new RuntimeException(
            'StagingDemoDatasetSeeder refused: APP_ENV must be local or staging'
            .' (got "'.$env.'", connection "'.$connection.'").'
            .' Set STAGING_DEMO_SEED_FORCE=1 only on a non-production staging DB.'
        );
    }

    /**
     * @return array{superAdmin: Role, teacher: Role}
     */
    private function ensureRolesAndPermissions(): array
    {
        $superAdmin = Role::query()->firstOrCreate(
            ['name' => 'super-admin', 'guard_name' => 'admin-api'],
            ['scope' => 'public']
        );

        $teacher = Role::query()->firstOrCreate(
            ['name' => 'teacher', 'guard_name' => 'admin-api'],
            ['scope' => 'private']
        );

        $resources = [
            'roles', 'teachers', 'users', 'subjects', 'students', 'schools',
            'classes', 'units', 'grades', 'games', 'worksheets', 'lessons', 'tickets',
            'lenssons', 'contents', 'quizes', 'questions', 'file_managers',
        ];

        foreach ($resources as $resource) {
            foreach (['view', 'add', 'edit', 'activation', 'export', 'delete'] as $action) {
                $name = $action.'-'.$resource;
                Permission::query()->firstOrCreate(
                    ['name' => $name, 'guard_name' => 'admin-api']
                );
            }
        }

        $superAdmin->syncPermissions(Permission::query()->where('guard_name', 'admin-api')->get());

        $teacherPerms = Permission::query()
            ->where('guard_name', 'admin-api')
            ->where(function ($q) {
                $q->where('name', 'like', 'view-%')
                    ->orWhere('name', 'like', 'add-%')
                    ->orWhere('name', 'like', 'edit-%');
            })
            ->get();
        $teacher->syncPermissions($teacherPerms);

        return [
            'superAdmin' => $superAdmin,
            'teacher' => $teacher,
        ];
    }

    private function ensureSchool(): Schools
    {
        return Schools::query()->updateOrCreate(
            ['name' => self::SCHOOL_NAME],
            [
                'name_ar' => self::SCHOOL_NAME,
                'email' => 'staging-demo-school@aboutabl.local',
                'contanct_number' => '01000000999',
                'status' => '1',
                'address' => 'Staging Demo Campus',
                'address_ar' => 'حرم تجريبي',
            ]
        );
    }

    private function ensureGrade(int $schoolId): Grades
    {
        return Grades::query()->updateOrCreate(
            [
                'school_id' => $schoolId,
                'name' => self::GRADE_NAME,
            ],
            [
                'status' => 1,
                'created_by' => null,
            ]
        );
    }

    private function ensureClass(int $schoolId, int $gradeId): Classes
    {
        return Classes::query()->updateOrCreate(
            [
                'school_id' => $schoolId,
                'name' => self::CLASS_NAME,
            ],
            [
                'grade_id' => $gradeId,
                'num_students' => 1,
                'status' => 1,
                'created_by' => null,
            ]
        );
    }

    private function ensureAdmin(Role $superAdmin): User
    {
        $admin = User::query()->updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            [
                'name' => 'Staging Demo Admin',
                'name_ar' => 'مشرف تجريبي',
                'username' => self::ADMIN_USERNAME,
                'phone' => 'stg_admin_01',
                'password' => Hash::make(self::PASSWORD),
                'defaultPassword' => self::PASSWORD,
                'type' => 'admin',
                'status' => '1',
                'verify' => '1',
                'role_id' => $superAdmin->id,
                'school_id' => null,
            ]
        );

        $admin->syncRoles([$superAdmin]);

        return $admin;
    }

    private function ensureTeacher(
        Schools $school,
        Grades $grade,
        Classes $class,
        Role $teacherRole
    ): User {
        $teacher = User::query()->updateOrCreate(
            ['email' => self::TEACHER_EMAIL],
            [
                'name' => 'Staging Demo Teacher',
                'name_ar' => 'معلم تجريبي',
                'username' => self::TEACHER_USERNAME,
                'phone' => 'stg_teach_01',
                'password' => Hash::make(self::PASSWORD),
                'defaultPassword' => self::PASSWORD,
                'type' => 'user',
                'status' => '1',
                'verify' => '1',
                'role_id' => $teacherRole->id,
                'school_id' => $school->id,
                'joining_date' => now()->format('Y-m-d'),
            ]
        );

        if (empty($teacher->memberShip)) {
            $teacher->update(['memberShip' => 'STGT'.str_pad((string) $teacher->id, 6, '0', STR_PAD_LEFT)]);
        }

        $teacher->syncRoles([$teacherRole]);

        SchoolsRoles::query()->firstOrCreate(
            [
                'school_id' => $school->id,
                'user_id' => $teacher->id,
            ],
            [
                'role_id' => $teacherRole->id,
            ]
        );

        Classes::query()->where('id', $class->id)->update([
            'teacher_id' => $teacher->id,
            'grade_id' => $grade->id,
            'updated_at' => now(),
        ]);

        return $teacher;
    }

    private function ensureStudent(Schools $school, Grades $grade, Classes $class): Student
    {
        $student = Student::query()->updateOrCreate(
            ['username' => self::STUDENT_USERNAME],
            [
                'memberShip' => self::STUDENT_USERNAME,
                'name' => 'Staging Demo Student',
                'name_ar' => 'طالب تجريبي',
                'email' => self::STUDENT_EMAIL,
                'password' => Hash::make(self::PASSWORD),
                'defaultPassword' => self::PASSWORD,
                'verify' => '1',
                'status' => '1',
                'api_token' => Str::random(60),
                'school_id' => $school->id,
                'grade_id' => $grade->id,
                'class_id' => $class->id,
            ]
        );

        Classes::query()->where('id', $class->id)->update([
            'num_students' => max(1, (int) ($class->num_students ?? 0)),
            'updated_at' => now(),
        ]);

        return $student;
    }

    private function ensureSubjectWithAccess(
        Schools $school,
        Grades $grade,
        Classes $class,
        User $teacher
    ): Subject {
        $subject = Subject::query()->updateOrCreate(
            ['name' => self::SUBJECT_NAME],
            [
                'name_ar' => 'إنجليزي تجريبي',
                'status' => '1',
                'des' => 'Staging demo subject for client walkthroughs.',
            ]
        );

        $subjectsSchoolsId = DB::table('subjects_schools')
            ->where('subject_id', $subject->id)
            ->where('school_id', $school->id)
            ->value('id');

        if (! $subjectsSchoolsId) {
            $payload = [
                'subject_id' => $subject->id,
                'school_id' => $school->id,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $subjectsSchoolsId = DB::table('subjects_schools')->insertGetId($payload);
        } else {
            DB::table('subjects_schools')->where('id', $subjectsSchoolsId)->update([
                'status' => '1',
                'updated_at' => now(),
            ]);
        }

        $gradeLink = DB::table('subjects_grades')
            ->where('subjects_schools_id', $subjectsSchoolsId)
            ->where('grade_id', $grade->id)
            ->where('subject_id', $subject->id)
            ->first();

        if (! $gradeLink) {
            DB::table('subjects_grades')->insert([
                'subjects_schools_id' => $subjectsSchoolsId,
                'subject_id' => $subject->id,
                'grade_id' => $grade->id,
                'school_id' => $school->id,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('subjects_grades')->where('id', $gradeLink->id)->update([
                'status' => '1',
                'school_id' => $school->id,
                'updated_at' => now(),
            ]);
        }

        if (Schema::hasTable('subjects_classes')) {
            $classLinkQuery = DB::table('subjects_classes')
                ->where('subject_id', $subject->id)
                ->where('class_id', $class->id);

            if (Schema::hasColumn('subjects_classes', 'teacher_id')) {
                $classLinkQuery->where('teacher_id', $teacher->id);
            }

            if (! $classLinkQuery->exists()) {
                $row = [
                    'subject_id' => $subject->id,
                    'class_id' => $class->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                if (Schema::hasColumn('subjects_classes', 'teacher_id')) {
                    $row['teacher_id'] = $teacher->id;
                }
                if (Schema::hasColumn('subjects_classes', 'status')) {
                    $row['status'] = 1;
                }
                if (Schema::hasColumn('subjects_classes', 'created_by')) {
                    $row['created_by'] = $teacher->id;
                }
                if (Schema::hasColumn('subjects_classes', 'subject_school_id')) {
                    $row['subject_school_id'] = $subjectsSchoolsId;
                }
                if (Schema::hasColumn('subjects_classes', 'school_id')) {
                    $row['school_id'] = $school->id;
                }
                if (Schema::hasColumn('subjects_classes', 'grade_id')) {
                    $row['grade_id'] = $grade->id;
                }
                DB::table('subjects_classes')->insert($row);
            }
        }

        return $subject;
    }

    private function ensureTeacherSubjectLink(
        User $teacher,
        Schools $school,
        Grades $grade,
        Classes $class,
        Subject $subject
    ): void {
        TeachersGrades::query()->updateOrCreate(
            [
                'user_id' => $teacher->id,
                'class_id' => $class->id,
                'subject_id' => $subject->id,
                'school_id' => $school->id,
            ],
            [
                'grade_id' => $grade->id,
                'status' => 1,
            ]
        );

        // Also ensure a class-level row without subject for roster-style queries.
        TeachersGrades::query()->firstOrCreate(
            [
                'user_id' => $teacher->id,
                'class_id' => $class->id,
                'school_id' => $school->id,
                'subject_id' => null,
            ],
            [
                'grade_id' => $grade->id,
                'status' => 1,
            ]
        );
    }

    /**
     * @return array{unit_id:int,lesson_id:int,content_id:int}
     */
    private function ensureCurriculum(Schools $school, Subject $subject): array
    {
        $unitQuery = DB::table('units')
            ->where('subject_id', $subject->id)
            ->where('name', self::UNIT_NAME);

        $unitId = (int) ($unitQuery->value('id') ?? 0);
        if ($unitId <= 0) {
            $unitRow = [
                'name' => self::UNIT_NAME,
                'name_ar' => 'وحدة تجريبية 1',
                'status' => '1',
                'type' => 'public',
                'subject_id' => $subject->id,
                'created_by' => null,
                'for_teacher' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('units', 'school_id')) {
                $unitRow['school_id'] = $school->id;
            }
            $unitId = (int) DB::table('units')->insertGetId($unitRow);
        }

        $lessonId = (int) (DB::table('lessons')
            ->where('subject_id', $subject->id)
            ->where('unit_id', $unitId)
            ->where('name_en', self::LESSON_NAME)
            ->value('id') ?? 0);

        if ($lessonId <= 0) {
            $lessonId = (int) DB::table('lessons')->insertGetId([
                'name_en' => self::LESSON_NAME,
                'name_ar' => 'درس تجريبي 1',
                'subject_id' => $subject->id,
                'unit_id' => $unitId,
                'created_by' => null,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $contentId = (int) (DB::table('lessons_contents')
            ->where('lesson_id', $lessonId)
            ->where('name_en', self::CONTENT_NAME)
            ->value('id') ?? 0);

        if ($contentId <= 0) {
            $contentId = (int) DB::table('lessons_contents')->insertGetId([
                'name_en' => self::CONTENT_NAME,
                'name_ar' => 'قراءة تمهيدية',
                'about_en' => 'Staging demo lesson content',
                'about_ar' => null,
                'subject_id' => $subject->id,
                'unit_id' => $unitId,
                'lesson_id' => $lessonId,
                'type' => 'scorm',
                'size' => null,
                'path' => null,
                'created_by' => null,
                'status' => 1,
                'privacy' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return [
            'unit_id' => $unitId,
            'lesson_id' => $lessonId,
            'content_id' => $contentId,
        ];
    }

    /**
     * @param  array{unit_id:int,lesson_id:int,content_id:int}  $curriculum
     */
    private function ensureLessonProgress(int $studentId, Subject $subject, array $curriculum): void
    {
        if (Schema::hasTable('student_lesson_content_completions')) {
            $exists = DB::table('student_lesson_content_completions')
                ->where('student_id', $studentId)
                ->where('lesson_content_id', $curriculum['content_id'])
                ->exists();

            if (! $exists) {
                DB::table('student_lesson_content_completions')->insert([
                    'student_id' => $studentId,
                    'lesson_content_id' => $curriculum['content_id'],
                    'lesson_id' => $curriculum['lesson_id'],
                    'completed_at' => now()->subHours(6),
                    'completion_source' => self::COMPLETION_SOURCE,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (Schema::hasTable('student_lesson_completions')) {
            $exists = DB::table('student_lesson_completions')
                ->where('student_id', $studentId)
                ->where('lesson_id', $curriculum['lesson_id'])
                ->exists();

            if (! $exists) {
                DB::table('student_lesson_completions')->insert([
                    'student_id' => $studentId,
                    'lesson_id' => $curriculum['lesson_id'],
                    'subject_id' => $subject->id,
                    'completed_at' => now()->subHours(5),
                    'completion_source' => self::COMPLETION_SOURCE,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function ensureSubjectProgressPercent(int $studentId, int $subjectId): void
    {
        if (! Schema::hasTable('student_subject_progress')) {
            return;
        }

        /** @var StudentSubjectProgressRepository $repo */
        $repo = app(StudentSubjectProgressRepository::class);
        $repo->saveProgress($studentId, $subjectId, 72.0);
    }

    /**
     * @param  array{unit_id:int,lesson_id:int,content_id:int}  $curriculum
     * @return array{assign_id:int,title:string}
     */
    private function ensureGradedAssignment(
        Student $student,
        User $teacher,
        Subject $subject,
        Grades $grade,
        array $curriculum
    ): array {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
        ) {
            throw new RuntimeException('Assignment tables missing; cannot seed staging assignment.');
        }

        $this->purgeTaggedAssignsForStudent((int) $student->id);

        $assignId = (int) DB::table('assigns')->insertGetId([
            'type' => LearningActivityMap::ASSIGN_TYPE,
            'type_id' => 0,
            'assigned_name' => self::ASSIGN_TITLE,
            'assigned_path' => '/todo',
            'school_id' => $student->school_id,
            'grade_id' => $grade->id,
            'subject_id' => $subject->id,
            'due_at' => now()->addDays(3)->endOfDay(),
            'possible_xp' => 50,
            'status' => 1,
            'created_by' => $teacher->id,
            'created_at' => now()->subDays(3),
            'updated_at' => now(),
        ]);

        $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
            'assign_id' => $assignId,
            'type' => LearningActivityMap::ASSIGN_TYPE,
            'type_id' => 0,
            'student_id' => $student->id,
            'school_id' => $student->school_id,
            'status' => 1,
            'opened_at' => now()->subDays(2),
            'submission_status' => AssignsStudents::SUBMISSION_GRADED,
            'submitted_at' => now()->subDay(),
            'graded_at' => now()->subHours(12),
            'created_by' => $teacher->id,
            'created_at' => now()->subDays(3),
            'updated_at' => now(),
        ]);

        $activityId = null;
        if (Schema::hasTable('assign_activities')) {
            $activityId = (int) DB::table('assign_activities')->insertGetId([
                'assign_id' => $assignId,
                'activity_type' => LearningActivityMap::TYPE_EBOOK,
                'activity_id' => $curriculum['content_id'],
                'source_table' => LearningActivityMap::SOURCE_TABLE[LearningActivityMap::TYPE_EBOOK],
                'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
                'title_snapshot' => self::CONTENT_NAME,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (
            $activityId
            && Schema::hasTable('assign_activity_submissions')
        ) {
            DB::table('assign_activity_submissions')->insert([
                'assign_id' => $assignId,
                'assign_activity_id' => $activityId,
                'assign_student_id' => $assignStudentId,
                'student_id' => $student->id,
                'status' => AssignActivitySubmission::STATUS_COMPLETED,
                'completeness' => 100,
                'percent' => 100,
                'submitted_at' => now()->subDay(),
                'graded_at' => now()->subDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (Schema::hasTable('assignment_grades')) {
            DB::table('assignment_grades')->insert([
                'assign_id' => $assignId,
                'assign_student_id' => $assignStudentId,
                'status' => AssignmentGrade::STATUS_FINALIZED,
                'final_percent' => 90.0,
                'badge_key' => 'excellent',
                'possible_xp' => 50,
                'earned_xp' => 45,
                'teacher_feedback' => self::MARKER.' Strong effort — clear understanding of the intro reading.',
                'graded_by' => $teacher->id,
                'finalized_at' => now()->subHours(12),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return [
            'assign_id' => $assignId,
            'title' => self::ASSIGN_TITLE,
        ];
    }

    private function purgeTaggedAssignsForStudent(int $studentId): void
    {
        $ids = DB::table('assigns')
            ->where('assigned_name', 'like', self::MARKER.'%')
            ->pluck('id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        if ($ids === []) {
            return;
        }

        if (Schema::hasTable('assignment_grades')) {
            DB::table('assignment_grades')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assign_activity_submissions')) {
            DB::table('assign_activity_submissions')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assign_activities')) {
            DB::table('assign_activities')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assignment_materials')) {
            DB::table('assignment_materials')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assignment_student_works')) {
            DB::table('assignment_student_works')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assignment_rubrics')) {
            $rubricIds = DB::table('assignment_rubrics')->whereIn('assign_id', $ids)->pluck('id');
            if (
                $rubricIds->isNotEmpty()
                && Schema::hasTable('assignment_rubric_criteria')
            ) {
                DB::table('assignment_rubric_criteria')
                    ->whereIn('assignment_rubric_id', $rubricIds)
                    ->delete();
            }
            DB::table('assignment_rubrics')->whereIn('assign_id', $ids)->delete();
        }

        DB::table('assigns_students')
            ->whereIn('assign_id', $ids)
            ->where('student_id', $studentId)
            ->delete();

        // Remove orphan demo assigns that only targeted this student graph.
        $remaining = DB::table('assigns_students')
            ->whereIn('assign_id', $ids)
            ->pluck('assign_id')
            ->unique()
            ->all();

        $orphans = array_values(array_diff($ids, $remaining));
        if ($orphans !== []) {
            DB::table('assigns')->whereIn('id', $orphans)->delete();
        }
    }

    private function ensureNotification(
        Student $student,
        User $teacher,
        Subject $subject,
        int $assignId
    ): void {
        /** @var NotificationInboxService $inbox */
        $inbox = app(NotificationInboxService::class);

        $inbox->createIfMissing([
            'title' => self::MARKER.' New graded homework',
            'description' => 'Your teacher graded '.self::ASSIGN_TITLE.'. Open To Do to review feedback.',
            'from_user_type' => NotificationInboxService::TYPE_TEACHER,
            'from_user_id' => $teacher->id,
            'to_user_type' => NotificationInboxService::TYPE_STUDENT,
            'to_user_id' => (int) $student->id,
            'url' => '/todo/assign/'.$assignId,
            'type' => 'staging_demo_assign',
            'type_id' => $assignId,
            'is_read' => 0,
        ]);

        // Subject-scoped secondary ping for inbox variety (idempotent via type+type_id).
        $inbox->createIfMissing([
            'title' => self::MARKER.' Welcome to '.$subject->name,
            'description' => 'Your staging demo subject and progress are ready on Learn.',
            'from_user_type' => NotificationInboxService::TYPE_SYSTEM,
            'from_user_id' => null,
            'to_user_type' => NotificationInboxService::TYPE_STUDENT,
            'to_user_id' => (int) $student->id,
            'url' => '/learn',
            'type' => 'staging_demo_welcome',
            'type_id' => (int) $subject->id,
            'is_read' => 0,
        ]);
    }
}
