<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Backfill assigns / assigns_students for legacy rows (admin assigns with null teacher_id).
     * due_date: default to calendar date of created_at where still null.
     */
    public function up(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('assigns')) {
            return;
        }

        $assignsNullCreatedBy = DB::table('assigns')->whereNull('created_by')->count();
        $assignsNullDue = DB::table('assigns')->whereNull('due_date')->count();
        $studentsNullCreatedBy = DB::getSchemaBuilder()->hasTable('assigns_students')
            ? DB::table('assigns_students')->whereNull('created_by')->count()
            : 0;

        Log::info('backfill_assigns: before', [
            'assigns_created_by_null' => $assignsNullCreatedBy,
            'assigns_due_date_null' => $assignsNullDue,
            'assigns_students_created_by_null' => $studentsNullCreatedBy,
        ]);

        DB::table('assigns')->whereNull('created_by')->orderBy('id')->chunkById(100, function ($assigns) {
            foreach ($assigns as $assign) {
                $cb = DB::table('assigns_students')
                    ->where('assign_id', $assign->id)
                    ->whereNotNull('created_by')
                    ->max('created_by');
                if ($cb) {
                    DB::table('assigns')->where('id', $assign->id)->update(['created_by' => $cb]);
                }
            }
        });

        if (DB::getSchemaBuilder()->hasTable('assigns_students')) {
            DB::table('assigns_students')->whereNull('created_by')->orderBy('id')->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    $parentCb = DB::table('assigns')->where('id', $row->assign_id)->value('created_by');
                    if ($parentCb) {
                        DB::table('assigns_students')->where('id', $row->id)->update(['created_by' => $parentCb]);
                    }
                }
            });
        }

        DB::table('assigns')->whereNull('due_date')->orderBy('id')->chunkById(100, function ($rows) {
            foreach ($rows as $row) {
                $date = $row->created_at
                    ? \Carbon\Carbon::parse($row->created_at)->toDateString()
                    : now()->toDateString();
                DB::table('assigns')->where('id', $row->id)->update(['due_date' => $date]);
            }
        });

        Log::info('backfill_assigns: after', [
            'assigns_created_by_null' => DB::table('assigns')->whereNull('created_by')->count(),
            'assigns_due_date_null' => DB::table('assigns')->whereNull('due_date')->count(),
            'assigns_students_created_by_null' => DB::getSchemaBuilder()->hasTable('assigns_students')
                ? DB::table('assigns_students')->whereNull('created_by')->count()
                : 0,
        ]);
    }

    public function down(): void
    {
        // Data backfill; no safe automatic rollback.
    }
};
