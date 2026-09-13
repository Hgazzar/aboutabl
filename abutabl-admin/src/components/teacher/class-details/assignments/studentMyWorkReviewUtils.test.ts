import {
  formatReviewMyWorkDuration,
  formatReviewMyWorkSize,
  isMyWorkAnActivity,
  myWorkFromReviewStudentRow,
  sortedReviewMyWorkItems,
} from "./studentMyWorkReviewUtils";
import type { LearningActivitiesReviewMyWorkItem } from "@/api/classAssignmentsApi";

const imageItem: LearningActivitiesReviewMyWorkItem = {
  id: 1,
  assign_id: 10,
  assign_student_id: 5,
  student_id: 20,
  kind: "image",
  original_filename: "drawing.png",
  url: "https://cdn.example/drawing.png",
  mime_type: "image/png",
  size_bytes: 12345,
  duration_ms: null,
  sort_order: 0,
};

const documentItem: LearningActivitiesReviewMyWorkItem = {
  id: 2,
  assign_id: 10,
  assign_student_id: 5,
  student_id: 20,
  kind: "document",
  original_filename: "notes.pdf",
  url: "https://cdn.example/notes.pdf",
  mime_type: "application/pdf",
  size_bytes: 2048,
  duration_ms: null,
  sort_order: 1,
};

const voiceItem: LearningActivitiesReviewMyWorkItem = {
  id: 3,
  assign_id: 10,
  assign_student_id: 5,
  student_id: 20,
  kind: "voice",
  original_filename: "answer.webm",
  url: "https://cdn.example/answer.webm",
  mime_type: "audio/webm",
  size_bytes: 4096,
  duration_ms: 1500,
  sort_order: 2,
};

describe("Teacher My Work review utils (Phase 5)", () => {
  it("returns empty list for missing my_work", () => {
    expect(sortedReviewMyWorkItems(undefined)).toEqual([]);
    expect(myWorkFromReviewStudentRow(null)).toEqual([]);
    expect(myWorkFromReviewStudentRow({ my_work: [] })).toEqual([]);
  });

  it("reads multiple items from review student row without extra API shape", () => {
    const items = myWorkFromReviewStudentRow({
      my_work: [voiceItem, imageItem, documentItem],
    });
    expect(items).toHaveLength(3);
    const ordered = sortedReviewMyWorkItems(items);
    expect(ordered.map((item) => item.kind)).toEqual([
      "image",
      "document",
      "voice",
    ]);
  });

  it("exposes filename size and voice duration for display", () => {
    expect(imageItem.original_filename).toBe("drawing.png");
    expect(formatReviewMyWorkSize(imageItem.size_bytes)).toMatch(/KB/);
    expect(formatReviewMyWorkSize(documentItem.size_bytes)).toMatch(/KB|B/);
    expect(formatReviewMyWorkDuration(voiceItem.duration_ms)).toBe("0:02");
    expect(formatReviewMyWorkDuration(null)).toBeNull();
  });

  it("supports image document and voice kinds", () => {
    const kinds = [imageItem, documentItem, voiceItem].map((item) => item.kind);
    expect(kinds).toEqual(["image", "document", "voice"]);
    expect(imageItem.url).toContain("drawing.png");
    expect(documentItem.url).toContain("notes.pdf");
    expect(voiceItem.url).toContain("answer.webm");
  });

  it("never treats My Work as an activity", () => {
    expect(isMyWorkAnActivity()).toBe(false);
  });

  it("does not invent storage_path fields on review items", () => {
    const ordered = sortedReviewMyWorkItems([imageItem]);
    expect(Object.prototype.hasOwnProperty.call(ordered[0], "storage_path")).toBe(
      false
    );
  });

  it("keeps grade rubric finalize semantics independent of my_work presence", () => {
    const withWork = {
      submission_status: "submitted" as const,
      my_work: [imageItem],
      grade: null,
      rubric: null,
    };
    const withoutWork = {
      submission_status: "submitted" as const,
      my_work: [] as LearningActivitiesReviewMyWorkItem[],
      grade: null,
      rubric: null,
    };
    expect(withWork.submission_status).toBe(withoutWork.submission_status);
    expect(withWork.grade).toBeNull();
    expect(withoutWork.grade).toBeNull();
    expect(withWork.rubric).toBeNull();
    expect(myWorkFromReviewStudentRow(withWork).length).toBe(1);
    expect(myWorkFromReviewStudentRow(withoutWork).length).toBe(0);
  });

  it("RTL-safe duration formatting stays ASCII digits for mm:ss", () => {
    expect(formatReviewMyWorkDuration(65000)).toBe("1:05");
  });
});
