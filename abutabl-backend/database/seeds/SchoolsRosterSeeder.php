<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Schools;
use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\Grades;
use App\Models\Classes;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\StudentFamily;

class SchoolsRosterSeeder extends Seeder
{
    /**
     * Column indices after header detection (Full Name, Email, Password, Class, Role).
     */
    protected $colFullName = 0;
    protected $colEmail = 1;
    protected $colPassword = 2;
    protected $colClass = 3;
    protected $colRole = 4;

    /**
     * Run the database seeds.
     */
    public function run()
    {
        $rosterPath = config('seed.schools_roster_path', base_path('../Schools roster'));

        if (!File::isDirectory($rosterPath)) {
            $this->command->warn("Schools roster path does not exist: {$rosterPath}");
            return;
        }

        $this->ensureTeacherRoleExists();

        $files = File::files($rosterPath);
        foreach ($files as $file) {
            $basename = $file->getFilename();
            if (!Str::endsWith(Str::lower($basename), '.xlsx') || Str::startsWith($basename, '~$')) {
                continue;
            }
            $schoolName = pathinfo($basename, PATHINFO_FILENAME);
            $this->command->info("Processing school: {$schoolName}");
            $this->processSchoolFile($file->getPathname(), $schoolName);
        }
    }

    protected function ensureTeacherRoleExists(): void
    {
        if (Role::whereRaw('LOWER(name) = ?', ['teacher'])->exists()) {
            return;
        }
        Role::create([
            'name'       => 'teacher',
            'guard_name' => 'admin-api',
            'scope'      => 'private',
        ]);
        $this->command->info('Created "teacher" role.');
    }

    protected function processSchoolFile(string $path, string $schoolName): void
    {
        $data = Excel::toArray(null, $path);
        if (empty($data) || empty($data[0])) {
            $this->command->warn("  No data in file: {$path}");
            return;
        }

        $rows = $data[0];
        $header = $rows[0] ?? [];
        $dataRows = $this->normalizeHeaderAndGetDataRows($header, $rows);
        if ($dataRows === null) {
            $this->command->warn("  Could not detect header (Full Name, Email, Password, Class, Role).");
            return;
        }

        DB::beginTransaction();
        try {
            $school = $this->firstOrCreateSchool($schoolName);
            $classMap = $this->buildGradesAndClasses($school->id, $dataRows);
            $this->processTeachers($school->id, $dataRows, $classMap);
            $this->processStudents($school->id, $dataRows, $classMap);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error("  Error processing {$schoolName}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Detect header row and return 0-based column indices. Return data rows (excluding header).
     * Returns null if header not found.
     */
    protected function normalizeHeaderAndGetDataRows(array $header, array $rows): ?array
    {
        $needles = ['full name', 'email', 'password', 'class', 'role'];
        $indices = [];
        foreach ($header as $i => $val) {
            $v = trim(strtolower((string) $val));
            if ($v === 'full name') {
                $indices['fullname'] = $i;
            } elseif ($v === 'email') {
                $indices['email'] = $i;
            } elseif ($v === 'password') {
                $indices['password'] = $i;
            } elseif ($v === 'class') {
                $indices['class'] = $i;
            } elseif ($v === 'role') {
                $indices['role'] = $i;
            }
        }
        if (count($indices) < 5) {
            return null;
        }
        $this->colFullName = $indices['fullname'];
        $this->colEmail = $indices['email'];
        $this->colPassword = $indices['password'];
        $this->colClass = $indices['class'];
        $this->colRole = $indices['role'];

        return array_slice($rows, 1);
    }

    protected function firstOrCreateSchool(string $schoolName): Schools
    {
        $name = trim($schoolName);
        $school = Schools::where('name', $name)->first();
        if ($school) {
            return $school;
        }
        return Schools::create([
            'name'            => $name,
            'name_ar'         => $name,
            'email'          => Str::slug($name) . '@roster.local',
            'contanct_number' => '',
            'status'         => '1',
            'address'         => null,
            'address_ar'      => null,
            'govern_id'       => null,
            'city_id'         => null,
        ]);
    }

    /**
     * Collect unique Class values from rows, create Grade + Class for each. Return map: classLabel => Class model.
     */
    protected function buildGradesAndClasses(int $schoolId, array $dataRows): array
    {
        $classLabels = [];
        foreach ($dataRows as $row) {
            $label = $this->cell($row, $this->colClass);
            if ($label !== '' && $label !== null) {
                $classLabels[$label] = true;
            }
        }
        $classLabels = array_keys($classLabels);

        $map = [];
        foreach ($classLabels as $label) {
            $grade = Grades::firstOrCreate(
                [
                    'school_id' => $schoolId,
                    'name'      => $label,
                ],
                [
                    'status'    => 1,
                    'created_by'=> null,
                ]
            );
            $class = Classes::firstOrCreate(
                [
                    'school_id' => $schoolId,
                    'name'      => $label,
                ],
                [
                    'grade_id'     => $grade->id,
                    'num_students' => 0,
                    'status'       => 1,
                    'created_by'   => null,
                ]
            );
            if ($class->grade_id !== $grade->id) {
                $class->update(['grade_id' => $grade->id]);
            }
            $map[$label] = $class;
        }

        return $map;
    }

    protected function processTeachers(int $schoolId, array $dataRows, array $classMap): void
    {
        $teacherRole = Role::whereRaw('LOWER(name) = ?', ['teacher'])->first();
        if (!$teacherRole) {
            return;
        }

        foreach ($dataRows as $row) {
            $roleVal = $this->cell($row, $this->colRole);
            if (strtolower(trim((string) $roleVal)) !== 'teacher') {
                continue;
            }

            $fullName = $this->cell($row, $this->colFullName);
            $email = $this->cell($row, $this->colEmail);
            if (trim((string) $fullName) === '' || trim((string) $email) === '') {
                continue;
            }

            $password = $this->cell($row, $this->colPassword);
            $password = trim((string) $password) !== '' ? $password : Str::random(8);
            $classLabel = $this->cell($row, $this->colClass);
            $class = isset($classMap[$classLabel]) ? $classMap[$classLabel] : null;

            $user = User::where('email', $email)->first();
            $username = $this->uniqueUsernameForEmail($email, $user ? $user->id : null);

            if ($user) {
                $user->update([
                    'name'           => trim($fullName),
                    'name_ar'        => trim($fullName),
                    'username'       => $username,
                    'password'       => bcrypt($password),
                    'defaultPassword'=> $password,
                    'school_id'      => $schoolId,
                    'role_id'        => $teacherRole->id,
                    'status'         => '1',
                    'type'           => 'user',
                    'verify'         => '1',
                ]);
                $user->update(['phone' => $this->getUniquePhone($user->id)]);
                if (!SchoolsRoles::where('school_id', $schoolId)->where('user_id', $user->id)->exists()) {
                    SchoolsRoles::create([
                        'role_id'   => $teacherRole->id,
                        'user_id'   => $user->id,
                        'school_id' => $schoolId,
                    ]);
                }
                $user->syncRoles([$teacherRole]);
            } else {
                $phone = $this->ensureUniquePhone(null, $username);
                $user = User::create([
                    'name'            => trim($fullName),
                    'name_ar'         => trim($fullName),
                    'username'        => $username,
                    'email'          => $email,
                    'phone'          => $phone,
                    'password'       => bcrypt($password),
                    'defaultPassword'=> $password,
                    'school_id'      => $schoolId,
                    'role_id'        => $teacherRole->id,
                    'status'         => '1',
                    'type'           => 'user',
                    'verify'         => '1',
                    'joining_date'   => now()->format('Y-m-d'),
                    'govern_id'      => null,
                    'city_id'        => null,
                ]);
                $memberShip = $this->generateTeacherMemberShip($user->id);
                $user->update(['memberShip' => $memberShip]);
                SchoolsRoles::create([
                    'role_id'   => $teacherRole->id,
                    'user_id'   => $user->id,
                    'school_id' => $schoolId,
                ]);
                $user->assignRole($teacherRole);
            }

            if ($class) {
                Classes::where('id', $class->id)->update(['teacher_id' => $user->id]);
                if (!TeachersGrades::where('school_id', $schoolId)->where('user_id', $user->id)->where('class_id', $class->id)->exists()) {
                    TeachersGrades::create([
                        'user_id'    => $user->id,
                        'grade_id'   => $class->grade_id,
                        'class_id'   => $class->id,
                        'school_id'  => $schoolId,
                        'subject_id' => null,
                        'status'     => 1,
                    ]);
                }
            }
        }
    }

    protected function processStudents(int $schoolId, array $dataRows, array $classMap): void
    {
        foreach ($dataRows as $row) {
            $roleVal = $this->cell($row, $this->colRole);
            if (strtolower(trim((string) $roleVal)) !== 'student') {
                continue;
            }

            $fullName = $this->cell($row, $this->colFullName);
            $email = $this->cell($row, $this->colEmail);
            if (trim((string) $fullName) === '') {
                continue;
            }

            $password = $this->cell($row, $this->colPassword);
            $password = trim((string) $password) !== '' ? $password : Str::random(8);
            $classLabel = $this->cell($row, $this->colClass);
            $class = isset($classMap[$classLabel]) ? $classMap[$classLabel] : null;
            $gradeId = $class ? $class->grade_id : null;
            $classId = $class ? $class->id : null;

            $student = Student::where('school_id', $schoolId)->where('email', $email)->first();

            if ($student) {
                $student->update([
                    'name'           => trim($fullName),
                    'name_ar'        => trim($fullName),
                    'email'          => $email,
                    'password'      => bcrypt($password),
                    'defaultPassword'=> $password,
                    'school_id'     => $schoolId,
                    'grade_id'      => $gradeId,
                    'class_id'      => $classId,
                    'status'        => '1',
                    'verify'        => '1',
                ]);
            } else {
                $student = Student::create([
                    'name'           => trim($fullName),
                    'name_ar'        => trim($fullName),
                    'email'          => $email,
                    'password'      => bcrypt($password),
                    'defaultPassword'=> $password,
                    'school_id'     => $schoolId,
                    'grade_id'      => $gradeId,
                    'class_id'      => $classId,
                    'username'      => 'pending',
                    'memberShip'    => 'pending',
                    'api_token'     => Str::random(60),
                    'status'        => '1',
                    'verify'        => '1',
                ]);
                $code = $this->generateStudentCode($schoolId, $student->id);
                $student->update([
                    'username'   => $code,
                    'memberShip' => $code,
                ]);
                $this->createMinimalStudentFamilies($student->id);
            }
        }
    }

    protected function cell(array $row, int $index)
    {
        return $row[$index] ?? null;
    }

    protected function uniqueUsernameForEmail(string $email, ?int $excludeUserId = null): string
    {
        $base = Str::before($email, '@');
        $base = preg_replace('/[^a-zA-Z0-9._-]/', '', $base) ?: 'user';
        $base = substr($base, 0, 50);
        $username = $base;
        $suffix = 0;
        do {
            $q = User::where('username', $username);
            if ($excludeUserId !== null) {
                $q->where('id', '!=', $excludeUserId);
            }
            if (!$q->exists()) {
                return $username;
            }
            $suffix++;
            $username = $base . $suffix;
        } while ($suffix < 10000);
        return $base . time();
    }

    /**
     * Get or generate unique phone for user. If user exists, update and return current; else generate new.
     */
    protected function ensureUniquePhone(?User $user = null, ?string $username = null): string
    {
        if ($user !== null) {
            $base = substr($user->username ?? 'user', 0, 8);
            $candidate = substr($base . '_' . $user->id, 0, 15);
        } else {
            $candidate = 'roster_' . Str::random(8);
            $candidate = substr($candidate, 0, 15);
        }
        $query = User::where('phone', $candidate);
        if ($user) {
            $query->where('id', '!=', $user->id);
        }
        if (!$query->exists()) {
            if ($user) {
                $user->update(['phone' => $candidate]);
            }
            return $candidate;
        }
        $suffix = 0;
        do {
            if ($user !== null) {
                $candidate = substr(($user->username ?? 'user') . '_' . $user->id . '_' . $suffix, 0, 15);
            } else {
                $candidate = substr('roster_' . Str::random(6) . $suffix, 0, 15);
            }
            $q = User::where('phone', $candidate);
            if ($user) {
                $q->where('id', '!=', $user->id);
            }
            $exists = $q->exists();
            $suffix++;
        } while ($exists && $suffix < 10000);
        if ($user) {
            $user->update(['phone' => $candidate]);
        }
        return $candidate;
    }

    protected function generateTeacherMemberShip(int $userId): string
    {
        $key = '12345678';
        $part = '';
        for ($i = 0; $i < 3; $i++) {
            $part .= $key[random_int(0, strlen($key) - 1)];
        }
        $code = $part . $userId;
        if (User::where('memberShip', $code)->exists()) {
            return $this->generateTeacherMemberShip($userId);
        }
        return $code;
    }

    protected function generateStudentCode(int $schoolId, int $studentId): string
    {
        $start = 1110;
        $code = $schoolId . ($start + $studentId);
        if (Student::where('memberShip', $code)->where('id', '!=', $studentId)->exists()) {
            $code = $schoolId . ($start + $studentId) . '_' . Str::random(4);
        }
        return $code;
    }

    protected function createMinimalStudentFamilies(int $studentId): void
    {
        if (StudentFamily::where('student_id', $studentId)->exists()) {
            return;
        }
        StudentFamily::create([
            'student_id' => $studentId,
            'relation'   => 'father',
            'name'       => '',
            'name_ar'    => '',
            'NID'        => '',
            'email'     => '',
            'phone'     => '',
            'job_id'    => null,
        ]);
        StudentFamily::create([
            'student_id' => $studentId,
            'relation'   => 'mather',
            'name'       => '',
            'name_ar'    => '',
            'NID'        => '',
            'email'     => '',
            'phone'     => '',
            'job_id'    => null,
        ]);
    }
}
