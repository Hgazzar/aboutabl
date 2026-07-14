<?php

namespace Database\Seeders;

use App\Models\Standard;
use App\Models\StandardDomain;
use App\Models\StandardPage;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StandardsSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = require database_path('data/ccss_standards.php');

        DB::transaction(function () use ($catalog) {
            foreach ($catalog as $subjectSlug => $domains) {
                $subject = Subject::where('slug', $subjectSlug)->first();

                if (! $subject) {
                    $this->command?->warn("Subject slug [{$subjectSlug}] not found — skipped.");

                    continue;
                }

                $this->command?->info("Seeding CCSS for subject #{$subject->id} ({$subjectSlug})");

                foreach ($domains as $domainData) {
                    $domain = StandardDomain::query()->updateOrCreate(
                        [
                            'subject_id' => $subject->id,
                            'name'       => $domainData['name'],
                        ],
                        [
                            'sort_order' => $domainData['sort_order'] ?? 0,
                            'status'     => 1,
                        ]
                    );

                    foreach ($domainData['standards'] as $sortOrder => $standardData) {
                        $standard = Standard::query()->updateOrCreate(
                            [
                                'subject_id' => $subject->id,
                                'code'       => $standardData['code'],
                            ],
                            [
                                'domain_id'   => $domain->id,
                                'grade_level' => 'K',
                                'definition'  => $standardData['definition'],
                                'sort_order'  => $sortOrder + 1,
                                'status'      => 1,
                            ]
                        );

                        foreach ($standardData['pages'] ?? [] as $pageNumber) {
                            StandardPage::query()->updateOrCreate(
                                [
                                    'standard_id' => $standard->id,
                                    'page_number' => (int) $pageNumber,
                                ],
                                []
                            );
                        }
                    }
                }
            }
        });

        $domainCount = StandardDomain::count();
        $standardCount = Standard::count();
        $pageCount = StandardPage::count();

        $this->command?->info("Done: {$domainCount} domains, {$standardCount} standards, {$pageCount} pages.");
    }
}
