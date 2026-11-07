import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("TeacherSideNav Live Games entry", () => {
  it("keeps primary Live Games navigation on /live-games", () => {
    const source = readFileSync(join(__dirname, "TeacherSideNav.tsx"), "utf8");
    expect(source).toContain('path: "/live-games"');
    expect(source).toContain("TEACHER_NAV.LIVE_GAMES");
  });

  it("unregisters legacy Interactive Games routes from App", () => {
    const app = readFileSync(join(__dirname, "../App.tsx"), "utf8");
    expect(app).toContain('path="live-games"');
    expect(app).toContain('path="games"');
    expect(app).toContain('path="games/:id"');
    expect(app).not.toContain('path="games/:id/waiting"');
    expect(app).not.toContain('path="games/:id/statistics"');
    expect(app).not.toContain('path="games/:id/facts"');
    expect(app).not.toContain('path="games/interactive"');
    expect(app).not.toContain("LegacyInteractiveGamesPage");
    expect(app).not.toContain("GamesWaiting");
  });
});
