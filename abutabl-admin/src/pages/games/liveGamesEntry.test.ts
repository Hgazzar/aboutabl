import { isAdminUser, isTeacherUser } from "@/utils/authSession";
import {
  canManageLiveCatalog,
  liveCatalogDetailPath,
  teacherLiveCompetitionsPath,
} from "./liveGamesEntry";

describe("liveGamesEntry", () => {
  it("gives the live catalog only to type=admin", () => {
    expect(canManageLiveCatalog({ type: "admin" })).toBe(true);
    expect(isAdminUser({ type: "admin" })).toBe(true);
    expect(isTeacherUser({ type: "admin" })).toBe(false);
  });

  it("redirects teachers away from the admin catalog", () => {
    expect(canManageLiveCatalog({ type: "teacher" })).toBe(false);
    expect(canManageLiveCatalog({ type: "user" })).toBe(false);
    expect(canManageLiveCatalog({})).toBe(false);
    expect(isTeacherUser({ type: "teacher" })).toBe(true);
    expect(isAdminUser({ type: "teacher" })).toBe(false);
  });

  it("keeps catalog detail on /games/:id", () => {
    expect(liveCatalogDetailPath(12)).toBe("/games/12");
  });

  it("keeps teacher live competitions on /live-games, not catalog /games/:id", () => {
    expect(teacherLiveCompetitionsPath()).toBe("/live-games");
    expect(teacherLiveCompetitionsPath()).not.toBe(liveCatalogDetailPath(1));
  });
});
