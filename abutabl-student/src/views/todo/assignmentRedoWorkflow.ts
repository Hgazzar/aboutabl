import type { AssignmentDetailPayload } from 'lib/assignmentDetailApi';

/** Busy token for header Assignment REDO (distinct from activity ids / Submit=-1). */
export const ASSIGNMENT_REDO_BUSY_ID = -2 as const;

/**
 * Race / gate check before starting Assignment REDO.
 * Backend remains authoritative for redo_allowed — this only prevents duplicate POSTs.
 */
export function shouldBlockAssignmentRedoClick(opts: {
	canShow: boolean;
	busyId: number | null;
}): boolean {
	return !opts.canShow || opts.busyId != null;
}

export type AssignmentRedoResult =
	| { ok: true; detail: AssignmentDetailPayload }
	| { ok: false; error: unknown; detail: AssignmentDetailPayload | null };

/**
 * Assignment REDO click flow:
 * 1) POST existing redo endpoint
 * 2) On success → GET authoritative Assignment Detail (do not invent active locally)
 * 3) If GET fails after successful POST → use the redo response payload (still server truth)
 * 4) On POST failure → refresh Detail so header flags match server truth
 *
 * Does NOT call Activity REDO for each activity.
 * Does NOT locally reset activity completion.
 */
export async function executeAssignmentRedo(opts: {
	assignId: number;
	redo: (assignId: number) => Promise<AssignmentDetailPayload>;
	refresh: (assignId: number) => Promise<AssignmentDetailPayload>;
}): Promise<AssignmentRedoResult> {
	let fromRedo: AssignmentDetailPayload | null = null;
	try {
		fromRedo = await opts.redo(opts.assignId);
	} catch (error) {
		let detail: AssignmentDetailPayload | null = null;
		try {
			detail = await opts.refresh(opts.assignId);
		} catch {
			detail = null;
		}
		return { ok: false, error, detail };
	}

	try {
		const detail = await opts.refresh(opts.assignId);
		return { ok: true, detail };
	} catch {
		return { ok: true, detail: fromRedo };
	}
}

/** Activities must keep backend completion after parent redo — no client reset. */
export function activitiesUnchangedByLocalReset(
	before: AssignmentDetailPayload['activities'],
	after: AssignmentDetailPayload['activities']
): boolean {
	if (before.length !== after.length) return false;
	return before.every((row, i) => {
		const next = after[i];
		return (
			next != null &&
			next.assign_activity_id === row.assign_activity_id &&
			next.submission?.status === row.submission?.status
		);
	});
}
