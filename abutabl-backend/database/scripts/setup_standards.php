<?php

/**
 * Creates standards schema + subjects.slug (idempotent).
 *
 * Usage: php database/scripts/setup_standards.php
 */

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

function out(string $message): void
{
    echo $message.PHP_EOL;
}

function columnExists(string $table, string $column): bool
{
    return Schema::hasTable($table) && Schema::hasColumn($table, $column);
}

out('=== ABOUTABL Standards Setup ===');

DB::statement('SET FOREIGN_KEY_CHECKS=0');

// ------------------------------------------------------------------
// subjects.slug
// ------------------------------------------------------------------
if (! columnExists('subjects', 'slug')) {
    Schema::table('subjects', function (Blueprint $table) {
        $table->string('slug', 100)->nullable()->after('name_ar');
        $table->unique('slug', 'uq_subjects_slug');
    });
    out('[OK] Added subjects.slug');
} else {
    out('[SKIP] subjects.slug already exists');
}

$slugMap = [
    10 => 'math-explorer',
];

foreach ($slugMap as $subjectId => $slug) {
    $updated = DB::table('subjects')
        ->where('id', $subjectId)
        ->where(function ($query) use ($slug) {
            $query->whereNull('slug')->orWhere('slug', '!=', $slug);
        })
        ->update(['slug' => $slug]);

    if ($updated) {
        out("[OK] subjects.id={$subjectId} slug => {$slug}");
    }
}

$lettersExists = DB::table('subjects')->where('slug', 'letters-explorer')->exists();

if (! $lettersExists) {
    $lettersByName = DB::table('subjects')
        ->whereIn('name', ['Letters Explorer', 'Letter Explorer'])
        ->first();

    if ($lettersByName) {
        DB::table('subjects')
            ->where('id', $lettersByName->id)
            ->update(['slug' => 'letters-explorer']);
        out("[OK] Backfilled slug letters-explorer on subjects.id={$lettersByName->id}");
    } else {
        $lettersId = DB::table('subjects')->insertGetId([
            'name'       => 'Letters Explorer',
            'name_ar'    => 'مستكشف الحروف',
            'slug'       => 'letters-explorer',
            'status'     => '1',
            'lang'       => 'en',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        out("[OK] Created Letters Explorer subject id={$lettersId} slug=letters-explorer");
    }
} else {
    out('[SKIP] Letters Explorer subject already exists');
}

// ------------------------------------------------------------------
// standard_domains
// ------------------------------------------------------------------
if (! Schema::hasTable('standard_domains')) {
    Schema::create('standard_domains', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('subject_id');
        $table->string('name', 191);
        $table->unsignedSmallInteger('sort_order')->default(0);
        $table->unsignedTinyInteger('status')->default(1);
        $table->unique(['subject_id', 'name'], 'uq_standard_domains_subject_name');
        $table->index('subject_id', 'idx_standard_domains_subject');
        $table->foreign('subject_id', 'fk_standard_domains_subject')
            ->references('id')->on('subjects')->onDelete('cascade');
    });
    out('[OK] Created table standard_domains');
} else {
    out('[SKIP] standard_domains already exists');
}

// ------------------------------------------------------------------
// standards
// ------------------------------------------------------------------
if (! Schema::hasTable('standards')) {
    Schema::create('standards', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('domain_id');
        $table->unsignedBigInteger('subject_id');
        $table->string('grade_level', 10)->default('K');
        $table->string('code', 32);
        $table->text('definition');
        $table->unsignedSmallInteger('sort_order')->default(0);
        $table->unsignedTinyInteger('status')->default(1);
        $table->unique(['subject_id', 'code'], 'uq_standards_subject_code');
        $table->index('domain_id', 'idx_standards_domain');
        $table->index('subject_id', 'idx_standards_subject');
        $table->index('grade_level', 'idx_standards_grade_level');
        $table->foreign('domain_id', 'fk_standards_domain')
            ->references('id')->on('standard_domains')->onDelete('cascade');
        $table->foreign('subject_id', 'fk_standards_subject')
            ->references('id')->on('subjects')->onDelete('cascade');
    });
    out('[OK] Created table standards');
} else {
    out('[SKIP] standards already exists');
}

// ------------------------------------------------------------------
// standard_pages
// ------------------------------------------------------------------
if (! Schema::hasTable('standard_pages')) {
    Schema::create('standard_pages', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('standard_id');
        $table->unsignedSmallInteger('page_number');
        $table->unique(['standard_id', 'page_number'], 'uq_standard_pages_standard_page');
        $table->index('page_number', 'idx_standard_pages_page');
        $table->foreign('standard_id', 'fk_standard_pages_standard')
            ->references('id')->on('standards')->onDelete('cascade');
    });
    out('[OK] Created table standard_pages');
} else {
    out('[SKIP] standard_pages already exists');
}

// ------------------------------------------------------------------
// assign_standard
// ------------------------------------------------------------------
if (! Schema::hasTable('assign_standard')) {
    Schema::create('assign_standard', function (Blueprint $table) {
        $table->unsignedBigInteger('assign_id');
        $table->unsignedBigInteger('standard_id');
        $table->enum('link_source', ['manual', 'page_match', 'import'])->default('manual');
        $table->timestamp('created_at')->nullable()->useCurrent();
        $table->primary(['assign_id', 'standard_id']);
        $table->index('standard_id', 'idx_assign_standard_standard');
        $table->foreign('assign_id', 'fk_assign_standard_assign')
            ->references('id')->on('assigns')->onDelete('cascade');
        $table->foreign('standard_id', 'fk_assign_standard_standard')
            ->references('id')->on('standards')->onDelete('cascade');
    });
    out('[OK] Created table assign_standard');
} else {
    out('[SKIP] assign_standard already exists');
}

// ------------------------------------------------------------------
// content_standard (lessons / quizes ↔ standards)
// ------------------------------------------------------------------
if (! Schema::hasTable('content_standard')) {
    Schema::create('content_standard', function (Blueprint $table) {
        $table->id();
        $table->string('content_type', 50);
        $table->unsignedBigInteger('content_id');
        $table->unsignedBigInteger('standard_id');
        $table->enum('link_source', ['manual', 'title_match', 'code_match', 'page_match', 'import'])->default('title_match');
        $table->timestamp('created_at')->nullable()->useCurrent();
        $table->unique(['content_type', 'content_id', 'standard_id'], 'uq_content_standard_triplet');
        $table->index(['content_type', 'content_id'], 'idx_content_standard_content');
        $table->index('standard_id', 'idx_content_standard_standard');
        $table->foreign('standard_id', 'fk_content_standard_standard')
            ->references('id')->on('standards')->onDelete('cascade');
    });
    out('[OK] Created table content_standard');
} else {
    out('[SKIP] content_standard already exists');
}

// Add surrogate id to content_standard (required for audit FK)
if (Schema::hasTable('content_standard') && ! columnExists('content_standard', 'id')) {
    DB::statement('ALTER TABLE `content_standard` DROP PRIMARY KEY');
    DB::statement('ALTER TABLE `content_standard` ADD COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST');
    DB::statement('ALTER TABLE `content_standard` ADD UNIQUE KEY `uq_content_standard_triplet` (`content_type`, `content_id`, `standard_id`)');
    out('[OK] Added content_standard.id surrogate key');
} elseif (columnExists('content_standard', 'id')) {
    out('[SKIP] content_standard.id already exists');
}

// ------------------------------------------------------------------
// standard_audit_logs
// ------------------------------------------------------------------
if (! Schema::hasTable('standard_audit_logs')) {
    Schema::create('standard_audit_logs', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('content_standard_id')->nullable();
        $table->unsignedBigInteger('standard_id');
        $table->enum('action', ['linked', 'unlinked', 'updated'])->default('linked');
        $table->enum('link_type', ['automatic', 'manual'])->default('automatic');
        $table->string('reason', 500);
        $table->decimal('confidence_score', 5, 2)->nullable();
        $table->timestamp('created_at')->useCurrent();
        $table->index('standard_id', 'idx_standard_audit_logs_standard');
        $table->index('content_standard_id', 'idx_standard_audit_logs_content_standard');
        $table->index('created_at', 'idx_standard_audit_logs_created_at');
        $table->foreign('content_standard_id', 'fk_standard_audit_logs_content_standard')
            ->references('id')->on('content_standard')->onDelete('set null');
        $table->foreign('standard_id', 'fk_standard_audit_logs_standard')
            ->references('id')->on('standards')->onDelete('cascade');
    });
    out('[OK] Created table standard_audit_logs');
} else {
    out('[SKIP] standard_audit_logs already exists');
}

DB::statement('SET FOREIGN_KEY_CHECKS=1');

out('');
out('=== Verification ===');

$tables = ['standard_domains', 'standards', 'standard_pages', 'assign_standard', 'content_standard', 'standard_audit_logs'];
foreach ($tables as $table) {
    $exists = Schema::hasTable($table) ? 'yes' : 'no';
    out("  {$table}: {$exists}");
}

out('  subjects.slug: '.(columnExists('subjects', 'slug') ? 'yes' : 'no'));

out('');
out('=== Subject slugs (explorer) ===');
$explorerSubjects = DB::table('subjects')
    ->whereIn('slug', ['math-explorer', 'letters-explorer'])
    ->orWhere('id', 10)
    ->get(['id', 'name', 'slug']);

foreach ($explorerSubjects as $row) {
    out("  id={$row->id} | {$row->name} | slug=".($row->slug ?? 'NULL'));
}

out('');
out('Done.');
