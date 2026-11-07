import {
  liveCompetitionHostPath,
  liveCompetitionRecoveryPath,
  liveCompetitionSessionPath,
} from "./paths";

describe("liveCompetitionRecoveryPath", () => {
  it("sends lobby sessions to the lobby page", () => {
    expect(liveCompetitionRecoveryPath({ id: 55, status: "lobby" })).toBe(
      liveCompetitionSessionPath(55)
    );
  });

  it("sends playing sessions to the host board without begin", () => {
    expect(liveCompetitionRecoveryPath({ id: 55, status: "playing" })).toBe(
      liveCompetitionHostPath(55)
    );
    expect(liveCompetitionRecoveryPath({ id: 55, status: "playing" })).not.toContain(
      "begin"
    );
  });

  it("sends ended sessions to the host board for reports", () => {
    expect(liveCompetitionRecoveryPath({ id: 9, status: "ended" })).toBe(
      liveCompetitionHostPath(9)
    );
  });
});
