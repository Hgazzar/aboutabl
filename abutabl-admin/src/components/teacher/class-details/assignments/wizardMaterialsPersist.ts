import {
  storeAssignmentMaterialFile,
  storeAssignmentMaterialLink,
  storeAssignmentMaterialVoice,
} from "@/api/classAssignmentsApi";
import { AssignmentMaterialItem } from "@/types/assignmentMaterials";

export function isValidMaterialLinkUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type PersistWizardMaterialResult = {
  id: string;
  kind: AssignmentMaterialItem["kind"];
  name: string;
  ok: boolean;
  error?: string;
};

export type PersistWizardMaterialsSummary = {
  total: number;
  succeeded: number;
  failed: PersistWizardMaterialResult[];
};

/**
 * Persist local Wizard materials via existing Materials API after assign create.
 * Sequential uploads — no transaction redesign.
 */
export async function persistWizardMaterials(
  assignId: number,
  materials: AssignmentMaterialItem[]
): Promise<PersistWizardMaterialsSummary> {
  const results: PersistWizardMaterialResult[] = [];

  for (const item of materials) {
    try {
      if (item.kind === "link") {
        const url = (item.url || "").trim();
        if (!isValidMaterialLinkUrl(url)) {
          results.push({
            id: item.id,
            kind: item.kind,
            name: item.name,
            ok: false,
            error: "invalid_link",
          });
          continue;
        }
        const response = await storeAssignmentMaterialLink(
          assignId,
          url,
          item.label
        );
        if (response?.status === false || !response.data) {
          results.push({
            id: item.id,
            kind: item.kind,
            name: item.name,
            ok: false,
            error: response?.msg || "upload_failed",
          });
          continue;
        }
        results.push({ id: item.id, kind: item.kind, name: item.name, ok: true });
        continue;
      }

      if (!item.file) {
        results.push({
          id: item.id,
          kind: item.kind,
          name: item.name,
          ok: false,
          error: "missing_file",
        });
        continue;
      }

      const response =
        item.kind === "voice"
          ? await storeAssignmentMaterialVoice(assignId, item.file, item.label)
          : await storeAssignmentMaterialFile(assignId, item.file, item.label);

      if (response?.status === false || !response.data) {
        results.push({
          id: item.id,
          kind: item.kind,
          name: item.name,
          ok: false,
          error: response?.msg || "upload_failed",
        });
        continue;
      }

      results.push({ id: item.id, kind: item.kind, name: item.name, ok: true });
    } catch (err: unknown) {
      results.push({
        id: item.id,
        kind: item.kind,
        name: item.name,
        ok: false,
        error:
          err instanceof Error ? err.message : "upload_failed",
      });
    }
  }

  const failed = results.filter((row) => !row.ok);
  return {
    total: results.length,
    succeeded: results.length - failed.length,
    failed,
  };
}
