<?php

namespace App\Services\Assignment;

use App\Contracts\Assignment\AssignmentMaterialResolverInterface;
use App\Models\AssignmentMaterial;
use Illuminate\Support\Facades\Storage;

/**
 * Reads persisted assignment_materials for an assign (SSOT).
 */
class AssignmentMaterialResolver implements AssignmentMaterialResolverInterface
{
    /**
     * Flat list ordered for API consumers.
     *
     * @return array<int, array<string, mixed>>
     */
    public function resolveForAssign(int $assignId): array
    {
        if ($assignId <= 0) {
            return [];
        }

        return AssignmentMaterial::query()
            ->where('assign_id', $assignId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(static function (AssignmentMaterial $row) {
                return self::serializeRow($row);
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeRow(AssignmentMaterial $row): array
    {
        $kind = (string) $row->kind;
        $url = null;

        if ($kind === AssignmentMaterial::KIND_LINK) {
            $url = $row->external_url ? (string) $row->external_url : null;
        } elseif ($row->storage_path) {
            $url = Storage::disk('public')->url((string) $row->storage_path);
        }

        return [
            'id' => (int) $row->id,
            'assign_id' => (int) $row->assign_id,
            'kind' => $kind,
            'label' => $row->label !== null ? (string) $row->label : null,
            'original_filename' => $row->original_filename !== null
                ? (string) $row->original_filename
                : null,
            'url' => $url,
            'mime_type' => $row->mime_type !== null ? (string) $row->mime_type : null,
            'size_bytes' => $row->size_bytes !== null ? (int) $row->size_bytes : null,
            'duration_ms' => $row->duration_ms !== null ? (int) $row->duration_ms : null,
            'sort_order' => (int) $row->sort_order,
        ];
    }
}
