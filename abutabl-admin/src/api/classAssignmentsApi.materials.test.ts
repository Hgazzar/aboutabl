import {
  storeAssignmentMaterialFile,
  storeAssignmentMaterialLink,
  storeAssignmentMaterialVoice,
} from "@/api/classAssignmentsApi";
import { postRequest } from "@/utils/fetchMethods";

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  postRequest: jest.fn(),
  deleteRequest: jest.fn(),
}));

const postRequestMock = postRequest as jest.MockedFunction<typeof postRequest>;

describe("classAssignmentsApi materials helpers", () => {
  beforeEach(() => {
    postRequestMock.mockReset();
    postRequestMock.mockResolvedValue({
      status: true,
      data: { id: 1, assign_id: 7, kind: "file", label: null, url: "/x" },
    });
  });

  it("posts file FormData to materials endpoint", async () => {
    const file = new File(["a"], "a.pdf", { type: "application/pdf" });
    await storeAssignmentMaterialFile(7, file, "Notes");
    expect(postRequestMock).toHaveBeenCalledTimes(1);
    const [body, url] = postRequestMock.mock.calls[0];
    expect(url).toBe("/api/assigns/7/materials");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("kind")).toBe("file");
    expect((body as FormData).get("label")).toBe("Notes");
    expect((body as FormData).get("file")).toBe(file);
  });

  it("posts voice FormData to materials endpoint", async () => {
    const file = new File(["b"], "b.webm", { type: "audio/webm" });
    await storeAssignmentMaterialVoice(7, file, "VOICE", 1500);
    const [body, url] = postRequestMock.mock.calls[0];
    expect(url).toBe("/api/assigns/7/materials");
    expect((body as FormData).get("kind")).toBe("voice");
    expect((body as FormData).get("duration_ms")).toBe("1500");
  });

  it("posts link FormData to materials endpoint", async () => {
    await storeAssignmentMaterialLink(7, "https://example.com/x", "LINK");
    const [body, url] = postRequestMock.mock.calls[0];
    expect(url).toBe("/api/assigns/7/materials");
    expect((body as FormData).get("kind")).toBe("link");
    expect((body as FormData).get("url")).toBe("https://example.com/x");
    expect((body as FormData).get("label")).toBe("LINK");
  });
});
