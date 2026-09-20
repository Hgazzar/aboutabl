import {
  isValidMaterialLinkUrl,
  persistWizardMaterials,
} from "./wizardMaterialsPersist";
import {
  storeAssignmentMaterialFile,
  storeAssignmentMaterialLink,
  storeAssignmentMaterialVoice,
} from "@/api/classAssignmentsApi";
import { AssignmentMaterialItem } from "@/types/assignmentMaterials";

jest.mock("@/api/classAssignmentsApi", () => ({
  storeAssignmentMaterialFile: jest.fn(),
  storeAssignmentMaterialVoice: jest.fn(),
  storeAssignmentMaterialLink: jest.fn(),
}));

const storeFile = storeAssignmentMaterialFile as jest.MockedFunction<
  typeof storeAssignmentMaterialFile
>;
const storeVoice = storeAssignmentMaterialVoice as jest.MockedFunction<
  typeof storeAssignmentMaterialVoice
>;
const storeLink = storeAssignmentMaterialLink as jest.MockedFunction<
  typeof storeAssignmentMaterialLink
>;

describe("wizardMaterialsPersist", () => {
  beforeEach(() => {
    storeFile.mockReset();
    storeVoice.mockReset();
    storeLink.mockReset();
  });

  it("validates http(s) links only", () => {
    expect(isValidMaterialLinkUrl("https://example.com/a")).toBe(true);
    expect(isValidMaterialLinkUrl("http://example.com")).toBe(true);
    expect(isValidMaterialLinkUrl("ftp://example.com")).toBe(false);
    expect(isValidMaterialLinkUrl("not-a-url")).toBe(false);
    expect(isValidMaterialLinkUrl("")).toBe(false);
  });

  it("persists file, voice, and link materials after create", async () => {
    storeFile.mockResolvedValue({
      status: true,
      data: { id: 1, assign_id: 9, kind: "file", label: "PDF", url: "/f" },
    });
    storeVoice.mockResolvedValue({
      status: true,
      data: { id: 2, assign_id: 9, kind: "voice", label: "VOICE", url: "/v" },
    });
    storeLink.mockResolvedValue({
      status: true,
      data: {
        id: 3,
        assign_id: 9,
        kind: "link",
        label: "LINK",
        url: "https://example.com",
      },
    });

    const file = new File(["pdf"], "notes.pdf", { type: "application/pdf" });
    const voice = new File(["audio"], "rec.webm", { type: "audio/webm" });
    const materials: AssignmentMaterialItem[] = [
      {
        id: "f1",
        kind: "file",
        label: "PDF",
        name: "notes.pdf",
        file,
      },
      {
        id: "v1",
        kind: "voice",
        label: "VOICE",
        name: "rec.webm",
        file: voice,
      },
      {
        id: "l1",
        kind: "link",
        label: "LINK",
        name: "example.com",
        url: "https://example.com/path",
      },
    ];

    const summary = await persistWizardMaterials(9, materials);
    expect(summary.total).toBe(3);
    expect(summary.succeeded).toBe(3);
    expect(summary.failed).toHaveLength(0);
    expect(storeFile).toHaveBeenCalledWith(9, file, "PDF");
    expect(storeVoice).toHaveBeenCalledWith(9, voice, "VOICE");
    expect(storeLink).toHaveBeenCalledWith(
      9,
      "https://example.com/path",
      "LINK"
    );
  });

  it("surfaces failed material uploads without aborting later items", async () => {
    storeFile.mockResolvedValue({ status: false, msg: "too_large" });
    storeLink.mockResolvedValue({
      status: true,
      data: {
        id: 3,
        assign_id: 9,
        kind: "link",
        label: "LINK",
        url: "https://ok.example",
      },
    });

    const materials: AssignmentMaterialItem[] = [
      {
        id: "f1",
        kind: "file",
        label: "PDF",
        name: "big.pdf",
        file: new File(["x"], "big.pdf"),
      },
      {
        id: "l1",
        kind: "link",
        label: "LINK",
        name: "ok",
        url: "https://ok.example",
      },
    ];

    const summary = await persistWizardMaterials(9, materials);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toHaveLength(1);
    expect(summary.failed[0].error).toBe("too_large");
    expect(storeLink).toHaveBeenCalled();
  });

  it("rejects link materials without a valid URL", async () => {
    const summary = await persistWizardMaterials(9, [
      {
        id: "l1",
        kind: "link",
        label: "LINK",
        name: "bad",
        url: "javascript:alert(1)",
      },
    ]);
    expect(summary.succeeded).toBe(0);
    expect(summary.failed[0].error).toBe("invalid_link");
    expect(storeLink).not.toHaveBeenCalled();
  });

  it("rejects file/voice items missing the File blob", async () => {
    const summary = await persistWizardMaterials(9, [
      {
        id: "f1",
        kind: "file",
        label: "PDF",
        name: "notes.pdf",
      },
    ]);
    expect(summary.failed[0].error).toBe("missing_file");
    expect(storeFile).not.toHaveBeenCalled();
  });
});
