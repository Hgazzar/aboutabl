<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\User;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use GeneralTrait;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
    }

    /**
     * Aggregated stats for the admin/teacher dashboard (scoped to accessible schools).
     */
    public function stats(Request $request)
    {
        try {
            $schoolIds = $this->SchoolsIDs();
            if (empty($schoolIds)) {
                return response()->json([
                    'status' => true,
                    'stats'  => [
                        'students_total'     => 0,
                        'students_active'    => 0,
                        'employees_total'    => 0,
                        'subjects_total'     => 0,
                        'assignments_open'   => 0,
                        'assignments_active' => 0,
                    ],
                    'charts' => [
                        'subjects_by_school' => [],
                    ],
                ], 200);
            }

            $studentsTotal = Student::whereIn('school_id', $schoolIds)->count();
            $studentsActive = Student::whereIn('school_id', $schoolIds)->where('status', '1')->count();

            $employeesTotal = User::whereIn('school_id', $schoolIds)
                ->where('type', '!=', 'admin')
                ->count();

            $subjectsTotal = (int) DB::table('subjects_schools')
                ->whereIn('school_id', $schoolIds)
                ->where('status', '1')
                ->selectRaw('COUNT(DISTINCT subject_id) as c')
                ->value('c');

            $assignIdsQuery = Assigns::whereIn('school_id', $schoolIds)->where('status', 1);
            if (auth()->user()->type !== 'admin') {
                $assignIdsQuery->where('created_by', auth()->id());
            }
            $assignIds = $assignIdsQuery->pluck('id');
            $assignmentsOpen = $assignIds->count();
            if ($assignIds->isEmpty()) {
                $assignmentsActive = 0;
            } else {
                $assignmentsActive = (int) DB::table('assigns_students')
                    ->whereIn('assign_id', $assignIds->all())
                    ->selectRaw('COUNT(DISTINCT student_id) as c')
                    ->value('c');
            }

            $subjectsBySchool = DB::table('subjects_schools')
                ->join('schools', 'schools.id', '=', 'subjects_schools.school_id')
                ->whereIn('subjects_schools.school_id', $schoolIds)
                ->where('subjects_schools.status', '1')
                ->groupBy('subjects_schools.school_id', 'schools.name')
                ->select('schools.name as school', DB::raw('COUNT(subjects_schools.id) as count'))
                ->get();

            return response()->json([
                'status' => true,
                'stats'  => [
                    'students_total'       => $studentsTotal,
                    'students_active'      => $studentsActive,
                    'students_inactive'    => max(0, $studentsTotal - $studentsActive),
                    'employees_total'      => $employeesTotal,
                    'subjects_total'       => $subjectsTotal,
                    'assignments_open'     => $assignmentsOpen,
                    'assignments_students' => $assignmentsActive,
                ],
                'charts' => [
                    'subjects_by_school' => $subjectsBySchool,
                ],
            ], 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Teacher-focused: recent assignments created by the current user with student reach.
     */
    public function teacherAssignments(Request $request)
    {
        try {
            $uid = auth()->id();
            $rows = Assigns::where('created_by', $uid)
                ->where('status', 1)
                ->withCount('Students')
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(['id', 'type', 'assigned_name', 'subject_id', 'created_at', 'due_at']);

            return response()->json([
                'status' => true,
                'assignments' => $rows,
            ], 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}
