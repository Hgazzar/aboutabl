<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Side table for the 26-column quiz workbook.
 * Does not add or change columns on questions.
 */
class CreateQuizWorkbookFieldsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_workbook_fields')) {
            $this->assertExistingTableMatches();

            return;
        }

        Schema::create('quiz_workbook_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->string('import_title', 255)->nullable();
            $table->longText('primary_head_text')->nullable();
            $table->longText('primary_content_text')->nullable();
            $table->longText('secondary_head_text')->nullable();
            $table->string('primary_head_audio', 255)->nullable();
            $table->string('primary_content_audio', 255)->nullable();
            $table->string('primary_content_image', 255)->nullable();
            $table->string('secondary_head_audio', 255)->nullable();
            $table->string('answer1_audio', 255)->nullable();
            $table->string('answer1_image', 255)->nullable();
            $table->string('answer2_audio', 255)->nullable();
            $table->string('answer2_image', 255)->nullable();
            $table->string('answer3_audio', 255)->nullable();
            $table->string('answer3_image', 255)->nullable();
            $table->string('answer4_audio', 255)->nullable();
            $table->string('answer4_image', 255)->nullable();
            $table->timestamps();

            $table->unique('question_id');
            $table->foreign('question_id')->references('id')->on('questions')->onDelete('cascade');
        });
    }

    /**
     * Stop when an existing table does not match. Do not alter or drop it.
     */
    private function assertExistingTableMatches(): void
    {
        $expected = [
            'id' => ['types' => ['bigint', 'integer'], 'nullable' => false],
            'question_id' => ['types' => ['bigint', 'integer'], 'nullable' => false],
            'import_title' => ['types' => ['string'], 'nullable' => true],
            'primary_head_text' => ['types' => ['text'], 'nullable' => true],
            'primary_content_text' => ['types' => ['text'], 'nullable' => true],
            'secondary_head_text' => ['types' => ['text'], 'nullable' => true],
            'primary_head_audio' => ['types' => ['string'], 'nullable' => true],
            'primary_content_audio' => ['types' => ['string'], 'nullable' => true],
            'primary_content_image' => ['types' => ['string'], 'nullable' => true],
            'secondary_head_audio' => ['types' => ['string'], 'nullable' => true],
            'answer1_audio' => ['types' => ['string'], 'nullable' => true],
            'answer1_image' => ['types' => ['string'], 'nullable' => true],
            'answer2_audio' => ['types' => ['string'], 'nullable' => true],
            'answer2_image' => ['types' => ['string'], 'nullable' => true],
            'answer3_audio' => ['types' => ['string'], 'nullable' => true],
            'answer3_image' => ['types' => ['string'], 'nullable' => true],
            'answer4_audio' => ['types' => ['string'], 'nullable' => true],
            'answer4_image' => ['types' => ['string'], 'nullable' => true],
            'created_at' => ['types' => ['datetime', 'datetimetz', 'datetime_immutable'], 'nullable' => true],
            'updated_at' => ['types' => ['datetime', 'datetimetz', 'datetime_immutable'], 'nullable' => true],
        ];

        $differences = [];
        $actualColumns = array_map('strtolower', Schema::getColumnListing('quiz_workbook_fields'));
        $missing = array_diff(array_keys($expected), $actualColumns);
        $unexpected = array_diff($actualColumns, array_keys($expected));
        foreach ($missing as $column) {
            $differences[] = 'missing column '.$column;
        }
        foreach ($unexpected as $column) {
            $differences[] = 'unexpected column '.$column;
        }

        $schemaManager = Schema::getConnection()->getDoctrineSchemaManager();
        $doctrineColumns = [];
        foreach ($schemaManager->listTableColumns('quiz_workbook_fields') as $name => $column) {
            $doctrineColumns[strtolower($name)] = $column;
        }
        foreach ($expected as $column => $rule) {
            if (! in_array($column, $actualColumns, true) && ! in_array($column, array_keys($doctrineColumns), true)) {
                continue;
            }
            $doctrineColumn = $doctrineColumns[strtolower($column)] ?? null;
            if ($doctrineColumn === null) {
                $differences[] = 'column '.$column.' could not be read';
                continue;
            }
            $type = $doctrineColumn->getType()->getName();
            if (! in_array($type, $rule['types'], true)) {
                $differences[] = 'column '.$column.' has type '.$type;
            }
            $isNullable = ! $doctrineColumn->getNotnull();
            if ($isNullable !== $rule['nullable']) {
                $differences[] = 'column '.$column.' nullability does not match';
            }
        }

        $questionIdIsUnique = false;
        foreach ($schemaManager->listTableIndexes('quiz_workbook_fields') as $index) {
            $columns = array_map('strtolower', $index->getColumns());
            if ($index->isUnique() && $columns === ['question_id']) {
                $questionIdIsUnique = true;
            }
        }
        if (! $questionIdIsUnique) {
            $differences[] = 'question_id is not unique';
        }

        $foreignKeyMatches = false;
        foreach ($schemaManager->listTableForeignKeys('quiz_workbook_fields') as $foreignKey) {
            $columns = array_map('strtolower', $foreignKey->getLocalColumns());
            $foreignTable = strtolower($foreignKey->getForeignTableName());
            $foreignColumns = array_map('strtolower', $foreignKey->getForeignColumns());
            $onDelete = strtolower((string) $foreignKey->onDelete());
            if ($columns === ['question_id'] && $foreignTable === 'questions' && $foreignColumns === ['id'] && $onDelete === 'cascade') {
                $foreignKeyMatches = true;
            }
        }
        if (! $foreignKeyMatches) {
            $differences[] = 'question_id foreign key to questions.id is missing';
        }

        if ($differences !== []) {
            throw new \RuntimeException(
                'quiz_workbook_fields already exists but does not match the required structure. '
                .'Migration stopped without changing the table. '
                .implode('; ', $differences).'.'
            );
        }
    }

    public function down()
    {
        Schema::dropIfExists('quiz_workbook_fields');
    }
}
