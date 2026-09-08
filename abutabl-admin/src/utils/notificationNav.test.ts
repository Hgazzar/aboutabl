import {
  countStaffUnreadNotifications,
  isStaffNotificationUnread,
  openStaffNotificationNavTarget,
  resolveStaffNotificationNavTarget,
} from "./notificationNav";

describe("notificationNav", () => {
  it("detects unread for string/number/boolean is_read", () => {
    expect(isStaffNotificationUnread({ is_read: "0" })).toBe(true);
    expect(isStaffNotificationUnread({ is_read: 0 })).toBe(true);
    expect(isStaffNotificationUnread({ is_read: false })).toBe(true);
    expect(isStaffNotificationUnread({ is_read: "1" })).toBe(false);
    expect(isStaffNotificationUnread({ is_read: 1 })).toBe(false);
  });

  it("counts unread notifications", () => {
    expect(
      countStaffUnreadNotifications([
        { is_read: "0" },
        { is_read: "1" },
        { is_read: 0 },
      ])
    ).toBe(2);
    expect(countStaffUnreadNotifications([])).toBe(0);
  });

  it("classifies internal relative paths used by admin/teacher SPA", () => {
    expect(resolveStaffNotificationNavTarget("/subjects/quiz/23")).toEqual({
      kind: "internal",
      path: "/subjects/quiz/23",
    });
    expect(resolveStaffNotificationNavTarget("user/student/view/1")).toEqual({
      kind: "internal",
      path: "/user/student/view/1",
    });
    expect(resolveStaffNotificationNavTarget("/todo")).toEqual({
      kind: "internal",
      path: "/todo",
    });
  });

  it("strips same-origin absolute URLs to pathname", () => {
    expect(
      resolveStaffNotificationNavTarget(
        "http://localhost:3000/subjects/quiz/9",
        "http://localhost:3000"
      )
    ).toEqual({ kind: "internal", path: "/subjects/quiz/9" });
  });

  it("preserves external absolute URLs", () => {
    expect(
      resolveStaffNotificationNavTarget("https://example.com/docs")
    ).toEqual({ kind: "external", href: "https://example.com/docs" });
  });

  it("treats protocol-relative URLs as external https (no SPA open-redirect)", () => {
    expect(resolveStaffNotificationNavTarget("//evil.example/phish")).toEqual({
      kind: "external",
      href: "https://evil.example/phish",
    });
  });

  it("ignores dangerous schemes", () => {
    expect(resolveStaffNotificationNavTarget("javascript:alert(1)")).toEqual({
      kind: "none",
    });
  });

  it("navigates internal and opens external safely", () => {
    const navigate = jest.fn();
    const openExternal = jest.fn();

    openStaffNotificationNavTarget(navigate, "/subjects/quiz/1", openExternal);
    expect(navigate).toHaveBeenCalledWith("/subjects/quiz/1");
    expect(openExternal).not.toHaveBeenCalled();

    openStaffNotificationNavTarget(
      navigate,
      "https://example.com/x",
      openExternal
    );
    expect(openExternal).toHaveBeenCalledWith("https://example.com/x");
  });
});
