import { normalizeLiveGameType } from "./liveGameTypes";

describe("normalizeLiveGameType", () => {
  it("normalizes known type aliases", () => {
    expect(normalizeLiveGameType("classic")).toBe("classic");
    expect(normalizeLiveGameType("Hacking")).toBe("hacking");
    expect(normalizeLiveGameType("gold-quest")).toBe("gold_quest");
    expect(normalizeLiveGameType("GoldQuest")).toBe("gold_quest");
  });

  it("returns null for unknown values", () => {
    expect(normalizeLiveGameType("")).toBeNull();
    expect(normalizeLiveGameType("scorm")).toBeNull();
  });
});
