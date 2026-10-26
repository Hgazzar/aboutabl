import { resolveStorageUrl, resolveSubjectPhotoUrl } from "./subjectPhotoUrl";

describe("resolveSubjectPhotoUrl", () => {
  const originalEnv = process.env.REACT_APP_BASE_URL;

  afterEach(() => {
    process.env.REACT_APP_BASE_URL = originalEnv;
  });

  it("returns null for empty, storage root, and backend logo fallback", () => {
    expect(resolveSubjectPhotoUrl(null)).toBeNull();
    expect(resolveSubjectPhotoUrl("")).toBeNull();
    expect(resolveSubjectPhotoUrl("https://api.example.com/storage/")).toBeNull();
    expect(
      resolveSubjectPhotoUrl("https://api.example.com/images/logo/site_logo.png")
    ).toBeNull();
  });

  it("keeps http(s) and data URLs", () => {
    expect(resolveSubjectPhotoUrl("https://cdn.example.com/cover.jpg")).toBe(
      "https://cdn.example.com/cover.jpg"
    );
    expect(resolveSubjectPhotoUrl("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc"
    );
  });

  it("prefixes relative storage paths with the API origin", () => {
    process.env.REACT_APP_BASE_URL = "https://api-new.aboutabl.com/api";
    expect(resolveSubjectPhotoUrl("subjects/1/cover.jpg")).toBe(
      "https://api-new.aboutabl.com/storage/subjects/1/cover.jpg"
    );
  });

  it("rewrites /storage paths on any host to the API origin", () => {
    process.env.REACT_APP_BASE_URL = "https://api-new.aboutabl.com/api";
    expect(
      resolveStorageUrl(
        "https://admin-new.aboutabl.com/storage/subjects/8/worksheets/files/x.pdf"
      )
    ).toBe(
      "https://api-new.aboutabl.com/storage/subjects/8/worksheets/files/x.pdf"
    );
  });
});
